# EnglishBuddy

Duolingo-style English learning web app for primary school children (grades 2–3), following the Oxford **Family and Friends 2nd Edition** ESL curriculum. Built to run locally on a Mac Mini and accessed from an iPad/iPhone via the home network.

---

## Features

### Exercise Types (7 implemented)
| Type | Skill | Description |
|------|-------|-------------|
| `word-match` | Reading | Pick the correct word for an image/emoji from 4 options |
| `listen-pick` | Listening | Hear a sentence via TTS, choose the correct answer |
| `fill-blank` | Writing | Complete the sentence with the missing word |
| `sentence-order` | Writing | Arrange a shuffled word bank into the correct sentence |
| `repeat-word` | Speaking | Say the word/phrase aloud; Web Speech Recognition checks pronunciation |
| `type-word` | Writing | Type the word from an image/audio cue with fuzzy matching |
| `pick-correct` | Reading | Choose the grammatically correct option from 3–4 choices |

### Gamification
- **XP system** — 5/10/15 points per correct answer based on difficulty
- **Hearts** — 5 hearts per lesson; lose 1 per wrong answer
- **⭐ Star ratings** — 1–3 stars per unit based on accuracy (< 70%, 70–90%, > 90%)
- **Streak counter** — daily login + complete a lesson to keep the streak alive
- **XP popup** — animated reward on every correct answer
- **Lesson summary** — XP earned, accuracy %, stars on lesson complete
- **Unit locking** — units without content are dimmed and non-clickable

### Lesson Flow
1. Progress bar at top (exercise N of total)
2. Exercises served one at a time, mixed across skills and difficulty levels
3. Correct → celebration animation + XP popup
4. Wrong → show correct answer, gentle nudge
5. Run out of hearts or finish → summary screen
6. Progress persisted to SQLite (XP, stars, unit completion, daily log)

### Audio
- **Text-to-Speech** (`speechSynthesis`, en-GB voice) for all listening exercises and word pronunciation
- **Sound effects** via Web Audio API (correct tone, wrong tone, level-up)
- **iOS AudioContext unlock** — auto-unlocks on first user tap so audio works immediately on iPad/iPhone

### Speaking Exercises
- `webkitSpeechRecognition` for recording the child's voice
- **Word-level diff** — each word in the transcript compared to the expected answer with Levenshtein distance; per-word ✅/❌ shown visually
- Fuzzy matching tolerates minor pronunciation differences

### Progress Dashboard
- Per-unit stars and completion status
- Skill breakdown (Listening, Speaking, Reading, Writing accuracy %)
- XP history

### Admin Panel (`/admin`, ⚙️ in bottom nav)
- **Per-unit regeneration** — one click to generate fresh exercises for a single unit using Claude Code CLI + WebSearch; resets only that unit's progress and recalculates overall XP
- **Regenerate All** — regenerates all 15 units + 5 reviews (~10–20 minutes total); resets all progress
- **Reset Data Only** — wipe all XP/progress/streaks instantly without regenerating content; user profiles (name, avatar) are always preserved
- **Real-time progress** — SSE stream shows live status per unit (⬜ idle → ⏳ generating → ✅ done / ❌ error)
- **Progress bar** — shows N/total units completed

### Content
- **307 pre-generated exercises** for FF2 (15 units × ~22 exercises + 5 reviews)
- Static JSON in `content/ff2/` — zero runtime AI cost
- Content regenerated on demand via `scripts/regenerate-content.js` + Claude Code CLI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| Animations | Framer Motion v12 |
| Database | SQLite via `better-sqlite3` + Drizzle ORM |
| Audio | Web Speech API (TTS + Speech Recognition) + Web Audio API |
| Content | Pre-generated JSON files (no runtime AI) |
| Process manager | PM2 (production) |
| HTTPS | mkcert + Node.js reverse proxy (`scripts/https-proxy.js`) |
| Content generation | Claude Code CLI (`claude -p` + `--allowedTools WebSearch`) |

---

## Project Structure

```
english-buddy/
├── content/
│   └── ff2/
│       ├── meta.json              # Book metadata, unit list
│       ├── unit-01/exercises.json # ~22 exercises per unit
│       ├── ...
│       ├── unit-15/exercises.json
│       └── review-01..05/exercises.json
├── db/
│   └── english-buddy.db           # SQLite database (git-ignored)
├── certs/                         # mkcert TLS certs (git-ignored)
│   ├── key.pem
│   └── cert.pem
├── public/
│   └── mkcert-rootCA.pem          # Root CA for iPad trust installation
├── scripts/
│   ├── regenerate-content.js      # Content generation via Claude CLI
│   └── https-proxy.js             # HTTPS reverse proxy (port 3443 → 3000)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home screen
│   │   ├── lesson/[bookId]/[unitId]/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── admin/page.tsx         # Admin panel
│   │   └── api/
│   │       ├── admin/regenerate/route.ts  # SSE content regeneration
│   │       ├── admin/reset-db/route.ts    # DB reset
│   │       ├── attempt/route.ts
│   │       ├── books/[bookId]/route.ts
│   │       ├── exercises/route.ts
│   │       ├── progress/route.ts
│   │       └── user/route.ts
│   ├── components/
│   │   ├── exercises/             # WordMatch, FillBlank, ListenPick,
│   │   │   │                      #   SentenceOrder, SpeakRepeat, TypeWord,
│   │   │   │                      #   PickCorrect, ExerciseRouter
│   │   ├── ui/                    # ProgressBar, HeartDisplay, XPPopup,
│   │   │   │                      #   StarRating, AudioUnlocker
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       └── BottomNav.tsx
│   ├── lib/
│   │   ├── db.ts                  # SQLite schema + Drizzle setup
│   │   ├── content.ts             # Load exercises from JSON
│   │   ├── speech.ts              # TTS helpers, AudioContext unlock
│   │   ├── sounds.ts              # Web Audio API tones
│   │   ├── scoring.ts             # XP, stars, streak logic
│   │   ├── fuzzyMatch.ts          # Levenshtein + wordDiff
│   │   └── lessonEngine.ts        # Exercise sequencing
│   ├── hooks/
│   │   ├── useSpeech.ts
│   │   ├── useSpeechRecognition.ts
│   │   ├── useExercise.ts
│   │   └── useProgress.ts
│   └── types/
│       ├── exercise.ts
│       ├── progress.ts
│       └── user.ts
├── ecosystem.config.js            # PM2 config (2 apps)
└── package.json
```

---

## Development Setup

### Prerequisites
- Node.js 20+ and pnpm
- macOS (for Claude Code CLI path `/opt/homebrew/bin/claude` used in regeneration)

### Run dev server
```bash
pnpm install
pnpm dev
# App runs on http://localhost:3001 (and http://<your-ip>:3001 for LAN access)
```

> **Note**: Dev runs on port **3001** (not 3000) to avoid conflicts with production PM2 process.

---

## Production Deployment (Mac Mini)

### 1. Install PM2
```bash
npm install -g pm2
```

### 2. Build and start
```bash
cd ~/Projects/english-buddy
pnpm install
pnpm build
pm2 start ecosystem.config.js
pm2 save          # persist across reboots
pm2 startup       # auto-start on boot (follow the printed command)
```

This starts two PM2 processes:
- **`english-buddy`** — Next.js app on port **3000**
- **`english-buddy-https`** — HTTPS reverse proxy on port **3443** → 3000

### 3. Access from iPad (HTTP — most features)
```
http://<mac-mini-ip>:3000
```

Find your Mac Mini's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 4. PM2 commands
```bash
pm2 list                    # show running processes
pm2 logs english-buddy      # tail logs
pm2 restart english-buddy   # restart after config change
pm2 stop all                # stop everything
```

---

## HTTPS Setup (required for Speech Recognition on iOS Safari)

iOS Safari requires HTTPS for `webkitSpeechRecognition`. The speaking exercises (`SpeakRepeat`) will fall back to a "type your answer" mode on HTTP — everything else works fine without HTTPS.

### One-time setup on Mac Mini

#### 1. Install mkcert
```bash
brew install mkcert
mkcert -install    # installs the local CA into macOS keychain
```

#### 2. Generate certs for your Mac Mini's local IP
```bash
cd ~/Projects/english-buddy
mkdir -p certs
# Replace 192.168.1.100 with your actual Mac Mini IP
mkcert -key-file certs/key.pem -cert-file certs/cert.pem \
  localhost 127.0.0.1 192.168.1.100 macmini.local
```

> The `certs/` directory is in `.gitignore`. Regenerate certs if your IP changes.

#### 3. Export root CA for iPad
```bash
cp "$(mkcert -CAROOT)/rootCA.pem" public/mkcert-rootCA.pem
```

### One-time setup on iPad

#### 4. Install the root CA certificate on iPad
1. Open Safari on iPad, go to: `http://<mac-mini-ip>:3000/mkcert-rootCA.pem`
2. Tap **Allow** → the profile downloads
3. Go to **Settings → General → VPN & Device Management**
4. Tap the **mkcert development CA** profile → **Install** → enter passcode
5. Go to **Settings → General → About → Certificate Trust Settings**
6. Enable full trust for **mkcert development CA** → **Continue**

#### 5. Use HTTPS on iPad
```
https://<mac-mini-ip>:3443
```

> Speech Recognition will now work in Safari. Bookmark this URL on iPad home screen.

---

## Admin Panel — Content Regeneration

Access: tap **⚙️** in the bottom nav, or go to `/admin`.

### Prerequisites
- Claude Code CLI installed at `/opt/homebrew/bin/claude` (Claude Max subscription)
- Internet connection (the script uses WebSearch to look up FF2 curriculum details)

### Regenerate a single unit
1. Find the unit in the list (e.g., "Unit 3: I can ride a bike")
2. Tap **🔄** next to it
3. Confirm the dialog
4. Wait ~30–60 seconds
5. Unit content is replaced + that unit's progress is reset; overall XP is recalculated

### Regenerate all content
1. Tap **🔄 Regenerate All** at the top
2. Confirm the dialog
3. Wait ~10–20 minutes (15 units + 5 reviews, sequential)
4. All content replaced + all progress reset (user profiles kept)

### Reset data only (no regeneration)
1. Tap **🗑️ Reset Data Only**
2. Confirm
3. All XP, streaks, unit progress, daily log wiped instantly
4. User names and avatars are preserved

### Status indicators
| Badge | Meaning |
|-------|---------|
| ⬜ | Idle (not yet processed) |
| ⏳ | Currently generating… |
| ✅ | Done (shows exercise count) |
| ❌ | Error (see detail text) |

### Manual script usage (Terminal)
```bash
# Regenerate all units + reviews
node scripts/regenerate-content.js --all

# Regenerate a single unit
node scripts/regenerate-content.js --unit 3

# Regenerate a review section
node scripts/regenerate-content.js --unit r1   # Review 1 (covers Units 1–3)
node scripts/regenerate-content.js --unit r2   # Review 2 (covers Units 4–6)
```

---

## Database Schema

```sql
users          -- id, name, avatar, current_book, current_unit,
               --   total_xp, streak_days, last_active, created_at
attempts       -- id, user_id, exercise_id, skill, correct,
               --   answer_given, time_spent_seconds, attempted_at
unit_progress  -- user_id, book, unit, stars, completed,
               --   best_accuracy, exercises_done
daily_log      -- user_id, date, xp_earned, lessons_completed
```

SQLite file lives at `db/english-buddy.db` (git-ignored). Auto-created with a default "Buddy" user on first run.

---

## Exercise JSON Schema

```typescript
interface Exercise {
  id: string;           // "ff2-u03-writing-001"
  unit: number;
  book: "ff2" | "ff3";
  skill: "listening" | "speaking" | "reading" | "writing";
  type: "word-match" | "listen-pick" | "fill-blank" | "sentence-order"
      | "repeat-word" | "type-word" | "pick-correct";
  difficulty: 1 | 2 | 3;
  question: string;
  options?: string[];           // required for word-match, listen-pick, pick-correct
  correctAnswer: string | string[];
  hint?: string;
  image?: string;               // emoji
  audio?: string;               // TTS text (spoken aloud by Web Speech API)
  points: 5 | 10 | 15;
}
```

Content lives in `content/ff2/unit-{NN}/exercises.json` and `content/ff2/review-{NN}/exercises.json`.

---

## License

Private project — not for distribution.
