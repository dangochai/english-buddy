"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { User } from "@/types/user";
import { useActiveUser } from "@/hooks/useActiveUser";

interface BookMeta {
  title: string;
  units: { number: number; title: string; topic: string }[];
}

interface UnitProgressEntry {
  unit: number;
  stars: number | null;
  completed: boolean | null;
}

const GREETINGS = [
  "Ready to learn? 🎉",
  "Let's go! 🚀",
  "Great to see you! 🌟",
  "Time to practice! 📚",
  "You can do it! 💪",
];

const AVATARS = ["🐻", "🐱", "🐶", "🦊", "🐼", "🦁", "🐸", "🐯", "🐥", "🦋"];
const AVATAR_KEYS = ["bear", "cat", "dog", "fox", "panda", "lion", "frog", "tiger", "chick", "butterfly"];

function avatarEmoji(key: string | null): string {
  const idx = AVATAR_KEYS.indexOf(key ?? "bear");
  return AVATARS[idx >= 0 ? idx : 0];
}

export default function HomePage() {
  const { userId, setActiveUserId } = useActiveUser();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bookMeta, setBookMeta] = useState<BookMeta | null>(null);
  const [unitProgressMap, setUnitProgressMap] = useState<Record<number, UnitProgressEntry>>({});
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("bear");

  // Fetch current user + book data when userId is resolved
  useEffect(() => {
    if (userId === null) return;

    fetch(`/api/user?userId=${userId}`)
      .then((res) => res.json())
      .then((data: User) => {
        setUser(data);
        const book = data.currentBook ?? "ff2";
        return Promise.all([
          fetch(`/api/books/${book}`).then((r) => r.json()),
          fetch(`/api/progress?userId=${userId}&book=${book}`).then((r) => r.json()),
        ]);
      })
      .then(([meta, progress]: [BookMeta, UnitProgressEntry[]]) => {
        setBookMeta(meta);
        const map: Record<number, UnitProgressEntry> = {};
        progress.forEach((p) => { map[p.unit] = p; });
        setUnitProgressMap(map);
      });
  }, [userId]);

  // Fetch all users for profile modal
  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then(setAllUsers);
  }, []);

  const handleSwitchUser = (id: number) => {
    setActiveUserId(id);
    setUser(null);
    setBookMeta(null);
    setUnitProgressMap({});
    setShowProfileModal(false);
  };

  const handleAddProfile = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), avatar: newAvatar }),
    });
    const created: User = await res.json();
    setAllUsers((prev) => [...prev, created]);
    setAddingProfile(false);
    setNewName("");
    setNewAvatar("bear");
    handleSwitchUser(created.id!);
  };

  if (userId === null || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="text-6xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          🐻
        </motion.div>
      </div>
    );
  }

  const currentBook = user.currentBook ?? "ff2";
  const currentUnit = user.currentUnit ?? 1;
  const currentUnitMeta = bookMeta?.units.find((u) => u.number === currentUnit);

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        {/* Mascot — tap to switch profile */}
        <motion.div
          className="mt-4 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <button
            onClick={() => setShowProfileModal(true)}
            className="relative cursor-pointer rounded-full p-1 transition-transform active:scale-95"
            aria-label="Switch profile"
          >
            <div className="text-8xl">{avatarEmoji(user.avatar ?? null)}</div>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 py-0.5 text-xs shadow">
              👤
            </span>
          </button>
          <motion.div
            className="mt-2 rounded-2xl bg-white px-6 py-3 shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="font-heading text-lg font-bold text-text">
              Hi {user.name}! {greeting}
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid w-full grid-cols-3 gap-3">
          <StatCard icon="⚡" value={user.totalXp ?? 0} label="XP" color="text-secondary" />
          <StatCard icon="🔥" value={user.streakDays ?? 0} label="Streak" color="text-error" />
          <StatCard icon="📖" value={`U${currentUnit}`} label={currentBook.toUpperCase()} color="text-accent" />
        </div>

        {/* Current Unit Card */}
        {currentUnitMeta && (
          <div className="w-full rounded-2xl bg-white p-5 shadow-md">
            <h2 className="font-heading text-lg font-bold text-text">
              Unit {currentUnit}: {currentUnitMeta.title}
            </h2>
            <p className="mt-1 text-sm text-text-light">
              {bookMeta?.title} — {currentUnitMeta.topic}
            </p>
          </div>
        )}

        {/* Start Lesson Button */}
        <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href={`/lesson/${currentBook}/${currentUnit}`}
            className="block min-h-[56px] w-full rounded-2xl bg-primary py-5 text-center text-xl font-bold text-white shadow-lg transition-colors hover:bg-primary-dark"
          >
            Start Lesson
          </Link>
        </motion.div>

        {/* Unit List */}
        {bookMeta && (
          <div className="w-full">
            <h3 className="font-heading mb-3 text-lg font-bold">Units</h3>
            <div className="space-y-2">
              {bookMeta.units.map((unit) => {
                const progress = unitProgressMap[unit.number];
                const earnedStars = progress?.stars ?? 0;
                const isUnlocked = unit.number <= currentUnit + 1;

                return isUnlocked ? (
                  <Link
                    key={unit.number}
                    href={`/lesson/${currentBook}/${unit.number}`}
                    className="flex min-h-[64px] items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <UnitRow unit={unit} isAvailable stars={earnedStars} />
                  </Link>
                ) : (
                  <div
                    key={unit.number}
                    className="flex min-h-[64px] items-center justify-between rounded-xl bg-white p-4 shadow-sm opacity-40"
                  >
                    <UnitRow unit={unit} isAvailable={false} stars={0} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profile Switcher Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowProfileModal(false); setAddingProfile(false); }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl bg-[#FFF8E1] p-6 shadow-xl"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading mb-5 text-center text-2xl font-bold text-text">
                Who&apos;s playing? 🎮
              </h2>

              {/* User list */}
              <div className="flex flex-col gap-3">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u.id!)}
                    className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all ${
                      u.id === userId
                        ? "bg-primary/10 ring-2 ring-primary"
                        : "bg-white shadow-sm hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-4xl">{avatarEmoji(u.avatar ?? null)}</span>
                    <div>
                      <p className="font-heading font-bold text-text">{u.name}</p>
                      <p className="text-sm text-text-light">⚡ {u.totalXp ?? 0} XP · 🔥 {u.streakDays ?? 0} days</p>
                    </div>
                    {u.id === userId && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                ))}

                {/* Add profile */}
                {!addingProfile ? (
                  <button
                    onClick={() => setAddingProfile(true)}
                    className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 p-4 text-text-light transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="text-3xl">➕</span>
                    <span className="font-semibold">Add profile</span>
                  </button>
                ) : (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddProfile()}
                      placeholder="Name…"
                      maxLength={20}
                      autoFocus
                      className="mb-3 w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-lg font-semibold text-text outline-none focus:border-primary"
                    />
                    {/* Avatar picker */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {AVATARS.map((emoji, i) => (
                        <button
                          key={AVATAR_KEYS[i]}
                          onClick={() => setNewAvatar(AVATAR_KEYS[i])}
                          className={`rounded-xl p-2 text-2xl transition-all ${
                            newAvatar === AVATAR_KEYS[i]
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAddingProfile(false); setNewName(""); }}
                        className="flex-1 rounded-xl border-2 border-gray-200 py-2 font-semibold text-text-light"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddProfile}
                        disabled={!newName.trim()}
                        className="flex-1 rounded-xl bg-primary py-2 font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function UnitRow({
  unit,
  isAvailable,
  stars,
}: {
  unit: { number: number; title: string; topic: string };
  isAvailable: boolean;
  stars: number;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold ${
            isAvailable ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-light"
          }`}
        >
          {unit.number}
        </span>
        <div>
          <p className="font-semibold text-text">{unit.title}</p>
          <p className="text-xs text-text-light">{unit.topic}</p>
        </div>
      </div>
      <div className="text-base">
        {isAvailable
          ? stars > 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <span key={i}>{i < stars ? "⭐" : "☆"}</span>
              ))
            : "▶️"
          : "🔒"}
      </div>
    </>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center rounded-xl bg-white p-3 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-text-light">{label}</span>
    </motion.div>
  );
}
