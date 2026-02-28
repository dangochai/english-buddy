import { NextResponse } from "next/server";
import { db, attempts, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, exerciseId, skill, correct, answerGiven, timeSpentSeconds, xpEarned } = body;

  // Record attempt
  db.insert(attempts).values({
    userId,
    exerciseId,
    skill,
    correct,
    answerGiven,
    timeSpentSeconds,
  }).run();

  // Update XP if correct
  if (correct && xpEarned > 0) {
    db.update(users)
      .set({ totalXp: sql`total_xp + ${xpEarned}` })
      .where(eq(users.id, userId))
      .run();
  }

  return NextResponse.json({ success: true });
}
