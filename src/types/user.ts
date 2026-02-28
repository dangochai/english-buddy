export interface User {
  id: number;
  name: string;
  avatar: string;
  currentBook: string;
  currentUnit: number;
  totalXp: number;
  streakDays: number;
  lastActive: string | null;
  createdAt: string;
}
