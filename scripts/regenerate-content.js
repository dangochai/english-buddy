#!/usr/bin/env node
/**
 * EnglishBuddy — Content Regeneration Script
 *
 * Usage:
 *   node scripts/regenerate-content.js --all          # regenerate all units + reviews
 *   node scripts/regenerate-content.js --unit 3       # regenerate unit 3 only
 *   node scripts/regenerate-content.js --unit r1      # regenerate review 1 only
 *
 * This script uses the `claude` CLI (Claude Code) in non-interactive mode
 * to generate fresh exercises for each unit, then resets the relevant DB progress.
 *
 * Progress is emitted to stdout as PROGRESS:<json> lines so the API route
 * can forward them as SSE events to the admin UI.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// ─── Paths ───────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.join(__dirname, "..");
const CLAUDE_BIN = "/opt/homebrew/bin/claude";
const META_PATH = path.join(PROJECT_ROOT, "content/ff2/meta.json");
const DB_PATH = path.join(PROJECT_ROOT, "db/english-buddy.db");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emit(obj) {
  process.stdout.write(`PROGRESS:${JSON.stringify(obj)}\n`);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Strip markdown code fences and extract the first JSON array from a string */
function extractJson(raw) {
  if (!raw) return null;
  let text = raw.trim();

  // Remove ```json ... ``` or ``` ... ``` fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return JSON.stringify(parsed, null, 2);
  } catch {
    // fall through
  }

  // Try to extract array between first [ and last ]
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return JSON.stringify(parsed, null, 2);
    } catch {
      // fall through
    }
  }

  return null;
}

/** Grammar points per unit (to constrain generation to FF2 scope) */
const UNIT_GRAMMAR = {
  1: "This is a ... / What's this? It's a ...",
  2: "He/She is ... / They're ... (adjectives)",
  3: "I can / I can't + verb",
  4: "This is my ... / Possessive pronouns (my, your, his, her)",
  5: "Where's the ...? It's in/on/under/behind/in front of the ...",
  6: "Let's ... / I've got a ...",
  7: "We've got a ... / Have you got a ...? Yes, I have / No, I haven't",
  8: "It's + weather adjective / What's the weather like?",
  9: "I'd like ... / Would you like ...? Yes, please / No, thank you",
  10: "I'd like ... / Some/any with food",
  11: "I + daily routine verb + at + time / What time do you ...?",
  12: "What day is it today? / Days of the week",
  13: "The ... is big/small/fast/slow (comparatives introduction)",
  14: "I'm wearing a ... / She's/He's wearing ...",
  15: "Review of all grammar from the book",
};

/** Build a detailed generation prompt for one unit */
function buildPrompt(target) {
  const isReview = target.isReview;
  const grammar = isReview
    ? "Review of grammar from previous 3 units"
    : UNIT_GRAMMAR[target.number] || "Simple present tense";

  const unitLabel = isReview
    ? `Review ${target.reviewNumber} (covers Units ${target.units.join(", ")})`
    : `Unit ${target.number}: "${target.title}" — Topic: ${target.topic}`;

  return `You are an ESL exercise creator for Family and Friends 2 (Oxford 2nd Edition), targeting Grade 2 students (age 7-8).

${unitLabel}
Grammar focus: ${grammar}

Search the internet for the exact vocabulary list, grammar structures, and phonics content in Family and Friends 2 ${isReview ? `Review ${target.reviewNumber}` : `Unit ${target.number}`} (Oxford, 2nd Edition). Use this to create accurate, curriculum-aligned exercises.

Generate exactly 22 exercises as a valid JSON array. Each exercise matches this schema:
{
  "id": string,           // format: "ff2-u${isReview ? `r${pad(target.reviewNumber)}` : pad(target.number)}-{skill}-{nnn}"  e.g. "ff2-u${pad(isReview ? 0 : target.number)}-reading-001"
  "unit": number,         // ${isReview ? target.units[0] : target.number} (use first unit number for reviews)
  "book": "ff2",
  "skill": "listening" | "speaking" | "reading" | "writing",
  "type": one of the exercise types below,
  "difficulty": 1 | 2 | 3,
  "question": string,     // instruction shown to student
  "options": string[],    // REQUIRED for word-match, listen-pick, pick-correct; optional for others
  "correctAnswer": string | string[],
  "hint": string,         // optional short hint
  "image": string,        // optional emoji representing the word/concept
  "audio": string,        // text for Text-to-Speech (what the app will speak aloud)
  "points": 5 | 10 | 15
}

Exercise type distribution (total = 22):
- "word-match": 4  — skill: "reading", points: 5 — show image/emoji, student picks correct word from 4 options
- "listen-pick": 3 — skill: "listening", points: 5 — audio field is what gets read aloud, student picks answer from options
- "fill-blank": 3  — skill: "writing", points: 10 — complete the sentence, correctAnswer is the missing word(s)
- "sentence-order": 3 — skill: "writing", points: 10 — options = shuffled words, student arranges them; correctAnswer = full sentence
- "repeat-word": 3 — skill: "speaking", points: 10 — student says the word/phrase; audio = what to say
- "type-word": 3   — skill: "writing", points: 10 — student types the word; use image/audio as cue
- "pick-correct": 3 — skill: "reading", points: 10 — choose grammatically correct option from 3-4 choices

Difficulty distribution: difficulty 1 = 7 exercises, difficulty 2 = 8, difficulty 3 = 7

Rules:
- British English spelling (colour, favourite, etc.)
- ID format for units: "ff2-u${pad(isReview ? (target.units ? target.units[0] : 1) : target.number)}-{skill}-{nnn}" where nnn starts at 001
- All sentences max 8 words
- Use emojis for "image" field (Unicode emoji that visually represents the word)
- For "listen-pick": audio = the sentence/word to listen to, options = answer choices
- For "sentence-order": options = array of individual words (the word bank), correctAnswer = the complete correct sentence
- For "word-match": options must include exactly 4 items (1 correct + 3 distractors from same semantic field)
- Age-appropriate content only: school, family, animals, food, weather, daily life
- Do NOT use grammar structures beyond FF2 scope

Output ONLY the raw JSON array starting with [ and ending with ]. No markdown, no code fences, no explanation.`;
}

/** Output file path for a target */
function outputPath(target) {
  if (target.isReview) {
    return path.join(PROJECT_ROOT, `content/ff2/review-${pad(target.reviewNumber)}/exercises.json`);
  }
  return path.join(PROJECT_ROOT, `content/ff2/unit-${pad(target.number)}/exercises.json`);
}

// ─── Argument Parsing ────────────────────────────────────────────────────────

function parseArgs(argv) {
  if (argv.includes("--all")) return { all: true };
  const unitIdx = argv.indexOf("--unit");
  if (unitIdx !== -1 && argv[unitIdx + 1]) {
    const val = argv[unitIdx + 1];
    if (val.startsWith("r")) {
      return { reviewNumber: parseInt(val.slice(1), 10) };
    }
    return { unit: parseInt(val, 10) };
  }
  // Default: regenerate all
  return { all: true };
}

function buildTargets(args, meta) {
  if (args.all) {
    const unitTargets = meta.units.map((u) => ({ ...u, isReview: false }));
    // Build review targets from unit groupings (units 1-3 → review 1, etc.)
    const reviewTargets = [
      { reviewNumber: 1, units: [1, 2, 3], isReview: true },
      { reviewNumber: 2, units: [4, 5, 6], isReview: true },
      { reviewNumber: 3, units: [7, 8, 9], isReview: true },
      { reviewNumber: 4, units: [10, 11, 12], isReview: true },
      { reviewNumber: 5, units: [13, 14, 15], isReview: true },
    ];
    return [...unitTargets, ...reviewTargets];
  }
  if (args.unit) {
    const unit = meta.units.find((u) => u.number === args.unit);
    if (!unit) throw new Error(`Unit ${args.unit} not found in meta.json`);
    return [{ ...unit, isReview: false }];
  }
  if (args.reviewNumber) {
    const reviewMap = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
      5: [13, 14, 15],
    };
    return [{ reviewNumber: args.reviewNumber, units: reviewMap[args.reviewNumber] || [], isReview: true }];
  }
  throw new Error("Invalid args — use --all, --unit N, or --unit rN");
}

// ─── DB Reset ────────────────────────────────────────────────────────────────

function resetAllProgress() {
  const db = new Database(DB_PATH);
  db.exec(`
    DELETE FROM attempts;
    DELETE FROM unit_progress;
    DELETE FROM daily_log;
    UPDATE users SET
      total_xp    = 0,
      streak_days = 0,
      current_unit = 1,
      current_book = 'ff2',
      last_active  = NULL;
  `);
  db.close();
}

function resetUnitProgress(unitNumber) {
  const db = new Database(DB_PATH);
  const unitPad = pad(unitNumber);
  db.prepare(`DELETE FROM attempts WHERE exercise_id LIKE ?`).run(`ff2-u${unitPad}-%`);
  db.prepare(`DELETE FROM unit_progress WHERE book = 'ff2' AND unit = ?`).run(unitNumber);
  // Recalculate XP from remaining attempts
  db.prepare(`
    UPDATE users SET total_xp = (
      SELECT COALESCE(SUM(CASE WHEN correct = 1 THEN 10 ELSE 0 END), 0)
      FROM attempts WHERE user_id = users.id
    )
  `).run();
  // Roll back current_unit if user was past this unit
  db.prepare(`
    UPDATE users
    SET current_unit = ?
    WHERE current_unit > ?
  `).run(unitNumber, unitNumber);
  db.close();
}

// ─── Main ────────────────────────────────────────────────────────────────────

(function main() {
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const args = parseArgs(process.argv.slice(2));
  const targets = buildTargets(args, meta);
  const total = targets.length;

  emit({ type: "start", total });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const id = target.isReview ? `r${target.reviewNumber}` : String(target.number);
    const label = target.isReview
      ? `Review ${target.reviewNumber}`
      : `Unit ${target.number}: ${target.title}`;

    emit({ type: "progress", id, label, status: "generating", index: i + 1, total });

    const prompt = buildPrompt(target);

    // Unset CLAUDECODE so `claude` CLI doesn't detect a nested session
    const childEnv = { ...process.env };
    delete childEnv.CLAUDECODE;

    const result = spawnSync(
      CLAUDE_BIN,
      ["-p", prompt, "--allowedTools", "WebSearch"],
      { encoding: "utf8", timeout: 300_000, maxBuffer: 4 * 1024 * 1024, env: childEnv }
    );

    if (result.error) {
      emit({ type: "progress", id, label, status: "error", detail: result.error.message });
      errorCount++;
      continue;
    }

    const jsonStr = extractJson(result.stdout);
    if (!jsonStr) {
      const detail = result.stderr?.slice(0, 300) || "No valid JSON in output";
      emit({ type: "progress", id, label, status: "error", detail });
      errorCount++;
      continue;
    }

    // Validate that it's an array
    let exercises;
    try {
      exercises = JSON.parse(jsonStr);
      if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new Error("Not a non-empty array");
      }
    } catch (e) {
      emit({ type: "progress", id, label, status: "error", detail: String(e) });
      errorCount++;
      continue;
    }

    // Write file
    const outPath = outputPath(target);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, jsonStr, "utf8");

    successCount++;
    emit({ type: "progress", id, label, status: "done", count: exercises.length });
  }

  // Reset DB
  if (args.all) {
    resetAllProgress();
    emit({ type: "db_reset", scope: "all" });
  } else if (args.unit) {
    resetUnitProgress(args.unit);
    emit({ type: "db_reset", scope: "unit", unit: args.unit });
  } else if (args.reviewNumber) {
    // Reviews don't map to unit_progress directly — no DB reset needed
    emit({ type: "db_reset", scope: "none" });
  }

  emit({ type: "complete", success: successCount, errors: errorCount, total });
})();
