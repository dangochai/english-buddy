export type ExerciseType =
  | "word-match"
  | "word-spell"
  | "word-scramble"
  | "fill-blank"
  | "sentence-order"
  | "pick-correct"
  | "listen-pick"
  | "listen-type"
  | "listen-match"
  | "repeat-word"
  | "repeat-sentence"
  | "answer-question"
  | "read-comprehension"
  | "read-true-false"
  | "read-match"
  | "type-word"
  | "type-sentence"
  | "fix-sentence"
  | "sound-match"
  | "rhyme-pick"
  | "blend-read";

export type Skill = "listening" | "speaking" | "reading" | "writing";
export type BookId = "ff2" | "ff3" | "ff4" | "ff5";

export interface Exercise {
  id: string;
  unit: number;
  book: BookId;
  skill: Skill;
  type: ExerciseType;
  difficulty: 1 | 2 | 3;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  hint?: string;
  image?: string;
  audio?: string;
  phonics?: string;
  points: number;
}
