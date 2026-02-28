import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import path from "path";

// Schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  avatar: text("avatar").default("bear"),
  currentBook: text("current_book").default("ff2"),
  currentUnit: integer("current_unit").default(1),
  totalXp: integer("total_xp").default(0),
  streakDays: integer("streak_days").default(0),
  lastActive: text("last_active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  exerciseId: text("exercise_id").notNull(),
  skill: text("skill").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  answerGiven: text("answer_given"),
  timeSpentSeconds: integer("time_spent_seconds"),
  attemptedAt: text("attempted_at").default(sql`CURRENT_TIMESTAMP`),
});

export const unitProgress = sqliteTable("unit_progress", {
  userId: integer("user_id").references(() => users.id),
  book: text("book").notNull(),
  unit: integer("unit").notNull(),
  stars: integer("stars").default(0),
  completed: integer("completed", { mode: "boolean" }).default(false),
  bestAccuracy: real("best_accuracy").default(0),
  exercisesDone: integer("exercises_done").default(0),
});

export const dailyLog = sqliteTable("daily_log", {
  userId: integer("user_id").references(() => users.id),
  date: text("date").notNull(),
  xpEarned: integer("xp_earned").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
});

// Database connection
const DB_PATH = path.join(process.cwd(), "db", "english-buddy.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, {
  schema: { users, attempts, unitProgress, dailyLog },
});

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'bear',
    current_book TEXT DEFAULT 'ff2',
    current_unit INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    exercise_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    correct BOOLEAN NOT NULL,
    answer_given TEXT,
    time_spent_seconds INTEGER,
    attempted_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS unit_progress (
    user_id INTEGER REFERENCES users(id),
    book TEXT NOT NULL,
    unit INTEGER NOT NULL,
    stars INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    best_accuracy REAL DEFAULT 0,
    exercises_done INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, book, unit)
  );

  CREATE TABLE IF NOT EXISTS daily_log (
    user_id INTEGER REFERENCES users(id),
    date TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
  );
`);

// Seed default user if empty
const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  sqlite.prepare("INSERT INTO users (name, avatar) VALUES (?, ?)").run("Buddy", "bear");
}
