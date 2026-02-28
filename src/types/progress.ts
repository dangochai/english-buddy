export interface UnitProgress {
  userId: number;
  book: string;
  unit: number;
  stars: number;
  completed: boolean;
  bestAccuracy: number;
  exercisesDone: number;
}

export interface DailyLog {
  userId: number;
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
}
