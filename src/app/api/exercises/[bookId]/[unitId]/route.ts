import { NextResponse } from "next/server";
import { getUnitExercises } from "@/lib/content";
import type { BookId } from "@/types/exercise";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; unitId: string }> }
) {
  const { bookId, unitId } = await params;
  const exercises = getUnitExercises(bookId as BookId, parseInt(unitId, 10));
  return NextResponse.json(exercises);
}
