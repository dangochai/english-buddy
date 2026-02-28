"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { User } from "@/types/user";

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

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookMeta, setBookMeta] = useState<BookMeta | null>(null);
  const [unitProgressMap, setUnitProgressMap] = useState<Record<number, UnitProgressEntry>>({});
  const [greeting] = useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  );

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data: User) => {
        setUser(data);
        const book = data.currentBook ?? "ff2";
        // Fetch book meta and unit progress in parallel
        return Promise.all([
          fetch(`/api/books/${book}`).then((r) => r.json()),
          fetch(`/api/progress?userId=1&book=${book}`).then((r) => r.json()),
        ]);
      })
      .then(([meta, progress]: [BookMeta, UnitProgressEntry[]]) => {
        setBookMeta(meta);
        const map: Record<number, UnitProgressEntry> = {};
        progress.forEach((p) => { map[p.unit] = p; });
        setUnitProgressMap(map);
      });
  }, []);

  if (!user) {
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
    <div className="flex flex-col items-center gap-6">
      {/* Mascot */}
      <motion.div
        className="mt-4 text-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="text-8xl">🐻</div>
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
      <motion.div
        className="w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
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
            isAvailable
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-text-light"
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
