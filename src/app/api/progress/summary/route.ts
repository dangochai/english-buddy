import { NextResponse } from "next/server";
import { db, attempts, unitProgress, dailyLog } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const SKILLS = ["listening", "speaking", "reading", "writing"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = parseInt(searchParams.get("userId") ?? "1", 10);
  const book = searchParams.get("book") ?? "ff2";

  // --- Skill accuracy ---
  const skillStats = SKILLS.map((skill) => {
    const total = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.skill, skill)))
      .get();

    const correct = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, userId),
          eq(attempts.skill, skill),
          eq(attempts.correct, true)
        )
      )
      .get();

    const totalCount = total?.count ?? 0;
    const correctCount = correct?.count ?? 0;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return { skill, total: totalCount, correct: correctCount, accuracy };
  });

  // --- Daily XP (last 7 days) ---
  const today = new Date();
  const days: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-GB", { weekday: "short" });
    days.push({ date: dateStr, label });
  }

  const sevenDaysAgo = days[0].date;
  const dailyLogs = db
    .select()
    .from(dailyLog)
    .where(
      and(
        eq(dailyLog.userId, userId),
        gte(dailyLog.date, sevenDaysAgo)
      )
    )
    .all();

  const logMap: Record<string, number> = {};
  dailyLogs.forEach((l) => { logMap[l.date] = l.xpEarned ?? 0; });

  const dailyXp = days.map(({ date, label }) => ({
    date,
    label,
    xpEarned: logMap[date] ?? 0,
  }));

  // --- Unit overview ---
  const units = db
    .select()
    .from(unitProgress)
    .where(and(eq(unitProgress.userId, userId), eq(unitProgress.book, book)))
    .all();

  return NextResponse.json({ skillStats, dailyXp, units });
}
