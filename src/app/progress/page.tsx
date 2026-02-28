"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { User } from "@/types/user";

interface SkillStat {
  skill: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface DailyXp {
  date: string;
  label: string;
  xpEarned: number;
}

interface UnitEntry {
  unit: number;
  stars: number | null;
  completed: boolean | null;
  bestAccuracy: number | null;
}

interface Summary {
  skillStats: SkillStat[];
  dailyXp: DailyXp[];
  units: UnitEntry[];
}

const SKILL_ICONS: Record<string, string> = {
  listening: "🎧",
  speaking: "🎤",
  reading: "📖",
  writing: "✏️",
};

const SKILL_COLORS: Record<string, string> = {
  listening: "bg-accent",
  speaking: "bg-error",
  reading: "bg-primary",
  writing: "bg-secondary",
};

export default function ProgressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data: User) => {
        setUser(data);
        const book = data.currentBook ?? "ff2";
        return fetch(`/api/progress/summary?userId=1&book=${book}`);
      })
      .then((res) => res.json())
      .then(setSummary);
  }, []);

  if (!user || !summary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="text-5xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          📊
        </motion.div>
      </div>
    );
  }

  const maxDailyXp = Math.max(...summary.dailyXp.map((d) => d.xpEarned), 1);
  const completedUnits = summary.units.filter((u) => u.completed).length;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <h1 className="font-heading text-2xl font-bold text-text">My Progress</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox icon="⚡" value={user.totalXp ?? 0} label="Total XP" color="text-secondary" />
        <StatBox icon="🔥" value={user.streakDays ?? 0} label="Day Streak" color="text-error" />
        <StatBox icon="✅" value={completedUnits} label="Units Done" color="text-primary" />
        <StatBox
          icon="🏆"
          value={(user.currentBook ?? "ff2").toUpperCase()}
          label="Current Level"
          color="text-accent"
        />
      </div>

      {/* Skill accuracy */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading mb-4 text-lg font-bold text-text">Skill Accuracy</h2>
        <div className="flex flex-col gap-4">
          {summary.skillStats.map((stat, i) => (
            <motion.div
              key={stat.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold capitalize text-text">
                  {SKILL_ICONS[stat.skill]} {stat.skill}
                </span>
                <span className="text-sm font-bold text-text-light">
                  {stat.total > 0 ? `${stat.accuracy}%` : "–"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className={`h-full rounded-full ${SKILL_COLORS[stat.skill]}`}
                  initial={{ width: 0 }}
                  animate={{ width: stat.total > 0 ? `${stat.accuracy}%` : "0%" }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-xs text-text-light">
                {stat.correct} / {stat.total} correct
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7-day XP chart */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading mb-4 text-lg font-bold text-text">This Week&apos;s XP</h2>
        <div className="flex h-32 items-end gap-2">
          {summary.dailyXp.map((day, i) => {
            const heightPct = (day.xpEarned / maxDailyXp) * 100;
            const isToday = i === summary.dailyXp.length - 1;
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold text-text-light">
                  {day.xpEarned > 0 ? day.xpEarned : ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    className={`w-full rounded-t-lg ${isToday ? "bg-primary" : "bg-primary/30"}`}
                    style={{ minHeight: day.xpEarned > 0 ? 4 : 0 }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPct, day.xpEarned > 0 ? 4 : 0)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                  />
                </div>
                <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-text-light"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Unit overview */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-heading mb-4 text-lg font-bold text-text">Units Overview</h2>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((unitNum) => {
            const entry = summary.units.find((u) => u.unit === unitNum);
            const stars = entry?.stars ?? 0;
            const done = entry?.completed ?? false;
            return (
              <motion.div
                key={unitNum}
                className={`flex flex-col items-center rounded-xl p-2 text-center ${
                  done ? "bg-primary/10" : "bg-gray-50"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: unitNum * 0.03 }}
              >
                <span className={`text-sm font-bold ${done ? "text-primary" : "text-text-light"}`}>
                  U{unitNum}
                </span>
                <span className="text-xs leading-tight">
                  {done
                    ? Array.from({ length: 3 }).map((_, i) => (i < stars ? "⭐" : "☆")).join("")
                    : "–"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatBox({
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
      className="flex flex-col items-center rounded-xl bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-3xl">{icon}</span>
      <span className={`mt-1 text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-text-light">{label}</span>
    </motion.div>
  );
}
