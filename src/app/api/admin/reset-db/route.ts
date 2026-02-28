import { NextResponse } from "next/server";
import { db, users, attempts, unitProgress, dailyLog } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reset-db
 *
 * Resets all user progress while keeping user profiles.
 * - Deletes: attempts, unit_progress, daily_log
 * - Resets users: XP → 0, streak → 0, currentUnit → 1, currentBook → ff2
 */
export async function POST() {
  try {
    // Delete all progress data
    db.delete(attempts).run();
    db.delete(unitProgress).run();
    db.delete(dailyLog).run();

    // Reset user stats but keep name + avatar
    db.update(users)
      .set({
        totalXp: 0,
        streakDays: 0,
        currentUnit: 1,
        currentBook: "ff2",
        lastActive: null,
      })
      .run();

    return NextResponse.json({ ok: true, message: "Progress reset successfully." });
  } catch (err) {
    console.error("[reset-db]", err);
    return NextResponse.json(
      { ok: false, message: String(err) },
      { status: 500 }
    );
  }
}
