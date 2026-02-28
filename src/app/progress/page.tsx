"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";

export default function ProgressPage() {
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
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-text">
        Progress
      </h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox icon="⚡" value={user.totalXp} label="Total XP" />
        <StatBox icon="🔥" value={user.streakDays} label="Day Streak" />
        <StatBox icon="📚" value={user.currentUnit} label="Current Unit" />
        <StatBox
          icon="🏆"
          value={(user.currentBook ?? "ff2").toUpperCase()}
          label="Current Level"
        />
      </div>

      {/* Placeholder for detailed progress */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <div className="text-4xl">📊</div>
        <p className="mt-2 font-semibold text-text">
          Detailed progress coming soon!
        </p>
        <p className="mt-1 text-sm text-text-light">
          Skill breakdown, accuracy charts, and vocabulary mastery will appear
          here.
        </p>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white p-4 shadow-sm">
      <span className="text-3xl">{icon}</span>
      <span className="mt-1 text-2xl font-bold text-text">{value}</span>
      <span className="text-xs text-text-light">{label}</span>
    </div>
  );
}
