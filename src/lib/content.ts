import fs from "fs";
import path from "path";
import type { Exercise, BookId } from "@/types/exercise";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getUnitExercises(book: BookId, unit: number): Exercise[] {
  const unitDir = path.join(CONTENT_DIR, book, `unit-${String(unit).padStart(2, "0")}`);
  const exercisesPath = path.join(unitDir, "exercises.json");

  if (!fs.existsSync(exercisesPath)) {
    return [];
  }

  const data = fs.readFileSync(exercisesPath, "utf-8");
  return JSON.parse(data) as Exercise[];
}

export function getBookMeta(book: BookId): { title: string; units: { number: number; title: string; topic: string }[] } | null {
  const metaPath = path.join(CONTENT_DIR, book, "meta.json");

  if (!fs.existsSync(metaPath)) {
    return null;
  }

  const data = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(data);
}
