"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { User } from "@/types/user";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

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
            Hi {user.name}! Ready to learn? 🎉
          </p>
        </motion.div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid w-full grid-cols-3 gap-3">
        <StatCard icon="⚡" value={user.totalXp} label="XP" color="text-secondary" />
        <StatCard icon="🔥" value={user.streakDays} label="Streak" color="text-error" />
        <StatCard icon="📖" value={`U${user.currentUnit}`} label={user.currentBook?.toUpperCase() ?? "FF2"} color="text-accent" />
      </div>

      {/* Current Progress */}
      <div className="w-full rounded-2xl bg-white p-5 shadow-md">
        <h2 className="font-heading text-lg font-bold text-text">
          Unit {user.currentUnit}: School Things
        </h2>
        <p className="mt-1 text-sm text-text-light">Family and Friends 2</p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: "15%" }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-text-light">15% complete</p>
      </div>

      {/* Start Lesson Button */}
      <motion.div
        className="w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          href={`/lesson/${user.currentBook ?? "ff2"}/${user.currentUnit}`}
          className="block w-full rounded-2xl bg-primary py-5 text-center text-xl font-bold text-white shadow-lg transition-colors hover:bg-primary-dark"
        >
          Start Lesson
        </Link>
      </motion.div>

      {/* Unit List */}
      <div className="w-full">
        <h3 className="font-heading mb-3 text-lg font-bold">Units</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((unit) => (
            <Link
              key={unit}
              href={`/lesson/ff2/${unit}`}
              className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 ${
                unit > 1 ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {unit}
                </span>
                <div>
                  <p className="font-semibold text-text">
                    {["What's this?", "They're happy", "I can ride a bike", "This is my family", "Where's the ball?"][unit - 1]}
                  </p>
                  <p className="text-xs text-text-light">
                    {["School things", "Feelings", "Abilities", "Family", "Prepositions"][unit - 1]}
                  </p>
                </div>
              </div>
              <div className="text-lg">
                {unit === 1 ? "⭐" : "🔒"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
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
