"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = "idle" | "generating" | "done" | "error";

interface ItemState {
  id: string;       // "1" .. "15" for units, "r1" .. "r5" for reviews
  label: string;
  status: ItemStatus;
  count?: number;   // exercises generated
  detail?: string;  // error message
}

// ─── Static unit/review list (mirrors meta.json) ──────────────────────────────

const UNITS: { id: string; label: string }[] = [
  { id: "1",  label: "Unit 1: What's this?" },
  { id: "2",  label: "Unit 2: They're happy" },
  { id: "3",  label: "Unit 3: I can ride a bike" },
  { id: "4",  label: "Unit 4: This is my family" },
  { id: "5",  label: "Unit 5: Where's the ball?" },
  { id: "6",  label: "Unit 6: Let's play!" },
  { id: "7",  label: "Unit 7: We've got a pet" },
  { id: "8",  label: "Unit 8: It's hot today" },
  { id: "9",  label: "Unit 9: What's for lunch?" },
  { id: "10", label: "Unit 10: Lunchtime!" },
  { id: "11", label: "Unit 11: I get up at seven" },
  { id: "12", label: "Unit 12: What day is it today?" },
  { id: "13", label: "Unit 13: Look at the animals!" },
  { id: "14", label: "Unit 14: I'm wearing a T-shirt" },
  { id: "15", label: "Unit 15: It's Fun Day!" },
];

const REVIEWS: { id: string; label: string }[] = [
  { id: "r1", label: "Review 1 (Units 1–3)" },
  { id: "r2", label: "Review 2 (Units 4–6)" },
  { id: "r3", label: "Review 3 (Units 7–9)" },
  { id: "r4", label: "Review 4 (Units 10–12)" },
  { id: "r5", label: "Review 5 (Units 13–15)" },
];

const ALL_ITEMS = [...UNITS, ...REVIEWS];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, count }: { status: ItemStatus; count?: number }) {
  if (status === "idle") return <span className="text-lg text-gray-300">⬜</span>;
  if (status === "generating")
    return (
      <motion.span
        className="text-lg"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        ⏳
      </motion.span>
    );
  if (status === "done")
    return (
      <span className="text-lg" title={count ? `${count} exercises` : undefined}>
        ✅
      </span>
    );
  return <span className="text-lg" title="Error">❌</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [statuses, setStatuses] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      ALL_ITEMS.map((item) => [item.id, { id: item.id, label: item.label, status: "idle" }])
    )
  );
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  function resetStatuses(ids: string[]) {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = { ...next[id], status: "idle", count: undefined, detail: undefined };
      }
      return next;
    });
  }

  function startSSE(url: string) {
    esRef.current?.close();
    setIsRunning(true);

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          setStatuses((prev) => ({
            ...prev,
            [data.id]: {
              id: data.id,
              label: data.label ?? prev[data.id]?.label ?? data.id,
              status: data.status,
              count: data.count,
              detail: data.detail,
            },
          }));
        }

        if (data.type === "complete") {
          setIsRunning(false);
          es.close();
          if (data.errors === 0) {
            showToast(`✅ Done! ${data.success}/${data.total} generated. Reload the app to see new content.`, "success");
          } else {
            showToast(`⚠️ Finished with ${data.errors} error(s). ${data.success} succeeded.`, "error");
          }
        }

        if (data.type === "closed" || data.type === "error") {
          setIsRunning(false);
          es.close();
          if (data.type === "error") {
            showToast(`❌ Script error: ${data.detail}`, "error");
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setIsRunning(false);
      es.close();
      showToast("Connection lost. Check server logs.", "error");
    };
  }

  function handleRegenerateAll() {
    if (!window.confirm("Regenerate ALL 15 units + 5 reviews?\n\nThis will take ~15–20 minutes and reset all user progress.\n\nContinue?")) return;
    resetStatuses(ALL_ITEMS.map((i) => i.id));
    startSSE("/api/admin/regenerate?scope=all");
  }

  function handleRegenerateUnit(id: string) {
    const item = ALL_ITEMS.find((i) => i.id === id);
    if (!item) return;
    if (!window.confirm(`Regenerate ${item.label}?\n\nProgress for this unit will be reset.\n\nContinue?`)) return;
    resetStatuses([id]);
    const isReview = id.startsWith("r");
    const url = isReview
      ? `/api/admin/regenerate?scope=unit&unit=${id}`
      : `/api/admin/regenerate?scope=unit&unit=${id}`;
    startSSE(url);
  }

  async function handleResetData() {
    if (!window.confirm("Reset ALL user progress?\n\nXP, streaks, and lesson history will be deleted.\nUser profiles (names) will be kept.\n\nContinue?")) return;
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/reset-db", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        showToast("🗑️ All progress reset. User profiles kept.", "success");
      } else {
        showToast(`Error: ${data.message}`, "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setResetLoading(false);
    }
  }

  const doneCount = Object.values(statuses).filter((s) => s.status === "done").length;
  const errorCount = Object.values(statuses).filter((s) => s.status === "error").length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <p className="font-heading text-2xl font-bold text-text">⚙️ Admin</p>
        <p className="mt-1 text-sm text-text-light">Content regeneration &amp; data management</p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              toast.type === "success"
                ? "bg-primary/10 text-primary"
                : "bg-error/10 text-error"
            }`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={handleRegenerateAll}
          disabled={isRunning}
          className={`min-h-[56px] w-full rounded-2xl py-4 text-base font-bold transition-all ${
            isRunning
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent/90"
          }`}
          whileTap={!isRunning ? { scale: 0.97 } : {}}
        >
          {isRunning ? "⏳ Generating…" : "🔄 Regenerate All Content"}
        </motion.button>
        <p className="text-center text-xs text-text-light">
          Regenerates all 15 units + 5 reviews using Claude Code · ~15–20 min
        </p>

        <motion.button
          onClick={handleResetData}
          disabled={isRunning || resetLoading}
          className={`min-h-[56px] w-full rounded-2xl border-2 border-error/30 py-4 text-base font-bold transition-all ${
            isRunning || resetLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-error/5 text-error hover:bg-error/10"
          }`}
          whileTap={!isRunning && !resetLoading ? { scale: 0.97 } : {}}
        >
          {resetLoading ? "Resetting…" : "🗑️ Reset Data Only"}
        </motion.button>
        <p className="text-center text-xs text-text-light">
          Keeps user profiles · Clears XP, streaks &amp; lesson progress
        </p>
      </div>

      {/* Progress summary bar */}
      {(doneCount > 0 || errorCount > 0) && (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-primary">✅ {doneCount} done</span>
            {errorCount > 0 && <span className="text-error">❌ {errorCount} errors</span>}
            <span className="text-text-light">{ALL_ITEMS.length} total</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(doneCount / ALL_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Units list */}
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-text-light">Units</p>
        <div className="flex flex-col gap-2">
          {UNITS.map((unit) => {
            const s = statuses[unit.id];
            return (
              <div
                key={unit.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={s.status} count={s.count} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{unit.label}</p>
                    {s.status === "error" && s.detail && (
                      <p className="truncate text-xs text-error">{s.detail}</p>
                    )}
                    {s.status === "done" && s.count && (
                      <p className="text-xs text-text-light">{s.count} exercises</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRegenerateUnit(unit.id)}
                  disabled={isRunning}
                  className={`ml-3 flex-none rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    isRunning
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-accent/10 text-accent hover:bg-accent/20"
                  }`}
                  title={`Regenerate ${unit.label}`}
                >
                  🔄
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-text-light">Reviews</p>
        <div className="flex flex-col gap-2">
          {REVIEWS.map((review) => {
            const s = statuses[review.id];
            return (
              <div
                key={review.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={s.status} count={s.count} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{review.label}</p>
                    {s.status === "error" && s.detail && (
                      <p className="truncate text-xs text-error">{s.detail}</p>
                    )}
                    {s.status === "done" && s.count && (
                      <p className="text-xs text-text-light">{s.count} exercises</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRegenerateUnit(review.id)}
                  disabled={isRunning}
                  className={`ml-3 flex-none rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    isRunning
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-accent/10 text-accent hover:bg-accent/20"
                  }`}
                  title={`Regenerate ${review.label}`}
                >
                  🔄
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-center text-xs text-text-light">
        <p className="font-semibold">ℹ️ How it works</p>
        <p className="mt-1">
          Uses Claude Code CLI to search the internet for FF2 curriculum content and generate
          fresh exercises. Each unit takes ~30–60 seconds.
        </p>
      </div>
    </div>
  );
}
