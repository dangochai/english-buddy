import { NextResponse } from "next/server";
import { db, users, unitProgress, dailyLog } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = parseInt(searchParams.get("userId") ?? "1", 10);
  const book = searchParams.get("book") ?? "ff2";

  const progress = db
    .select()
    .from(unitProgress)
    .where(and(eq(unitProgress.userId, userId), eq(unitProgress.book, book)))
    .all();

  return NextResponse.json(progress);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, book, unit, stars, accuracy, exercisesDone, xpEarned } = body;

  // Upsert unit progress
  const existing = db
    .select()
    .from(unitProgress)
    .where(
      and(
        eq(unitProgress.userId, userId),
        eq(unitProgress.book, book),
        eq(unitProgress.unit, unit)
      )
    )
    .get();

  if (existing) {
    db.update(unitProgress)
      .set({
        stars: Math.max(existing.stars ?? 0, stars),
        completed: true,
        bestAccuracy: Math.max(existing.bestAccuracy ?? 0, accuracy),
        exercisesDone: (existing.exercisesDone ?? 0) + exercisesDone,
      })
      .where(
        and(
          eq(unitProgress.userId, userId),
          eq(unitProgress.book, book),
          eq(unitProgress.unit, unit)
        )
      )
      .run();
  } else {
    db.insert(unitProgress)
      .values({
        userId,
        book,
        unit,
        stars,
        completed: true,
        bestAccuracy: accuracy,
        exercisesDone,
      })
      .run();
  }

  // Update daily log
  const today = new Date().toISOString().split("T")[0];
  const todayLog = db
    .select()
    .from(dailyLog)
    .where(and(eq(dailyLog.userId, userId), eq(dailyLog.date, today)))
    .get();

  if (todayLog) {
    db.update(dailyLog)
      .set({
        xpEarned: sql`xp_earned + ${xpEarned}`,
        lessonsCompleted: sql`lessons_completed + 1`,
      })
      .where(and(eq(dailyLog.userId, userId), eq(dailyLog.date, today)))
      .run();
  } else {
    db.insert(dailyLog)
      .values({ userId, date: today, xpEarned, lessonsCompleted: 1 })
      .run();
  }

  // Update user: streak + currentUnit + totalXp
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (user) {
    const lastActive = user.lastActive;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = user.streakDays ?? 0;
    if (lastActive === today) {
      // Already active today, keep streak
    } else if (lastActive === yesterdayStr) {
      newStreak += 1;
    } else if (!lastActive) {
      newStreak = 1;
    } else {
      newStreak = 1; // Streak broken
    }

    // Advance currentUnit if this lesson is at or beyond the current frontier
    const newCurrentUnit =
      unit >= (user.currentUnit ?? 1)
        ? unit + 1
        : user.currentUnit ?? 1;

    db.update(users)
      .set({
        lastActive: today,
        streakDays: newStreak,
        currentUnit: newCurrentUnit,
      })
      .where(eq(users.id, userId))
      .run();
  }

  return NextResponse.json({ success: true });
}
