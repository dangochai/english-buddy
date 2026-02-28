# CLAUDE.md — EnglishBuddy: English Learning App for Kids

## Project Overview

**EnglishBuddy** is a Duolingo-style English learning web app for primary school children (grades 1-5), following the Oxford "Family and Friends" (2nd Edition) ESL curriculum. The app covers all 4 skills: Listening, Speaking, Reading, and Writing.

### Key Constraints
- **Target users**: 1-2 kids at home, grades 2-3, currently using Family and Friends Level 2-3
- **Platform**: Responsive Web App (Safari on iPad/iPhone primary, desktop secondary)
- **Deployment**: Local server on Mac Mini (macOS, runs 24/7) via home network. Public deployment later.
- **AI strategy**: Full offline content — ALL exercises, questions, audio scripts are pre-generated. No runtime AI API calls.
- **Cost**: Zero operational cost (no API needed at runtime)
- **Development tool**: Claude Code with Claude Max subscription

---

## Tech Stack

### Frontend
- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** for styling — kid-friendly, colorful, large touch targets
- **Framer Motion** for animations and transitions (reward animations, progress bars)
- **Web Speech API** (built-in Safari) for:
  - Speech Recognition (Speaking exercises) — `webkitSpeechRecognition`
  - Speech Synthesis (Listening exercises, word pronunciation) — `speechSynthesis`
- **PWA-ready** via `next-pwa` (optional: installable on iPad home screen later)

### Backend
- **Next.js API Routes** (same app, no separate backend)
- **SQLite** via `better-sqlite3` for local data storage (progress, scores, streaks)
- **File-based content**: Pre-generated JSON files for all lessons/exercises

### Deployment (Local)
- **Mac Mini** running macOS
- **Node.js** + `pm2` for process management (auto-restart)
- Access via local IP (e.g., `http://192.168.1.100:3000`) on iPad Safari
- Optional: use `.local` hostname via mDNS (e.g., `http://macmini.local:3000`)

---

## Curriculum Structure — Family and Friends 2nd Edition

### Level Mapping
| App Level | School Grade | FF Book | CEFR |
|-----------|-------------|---------|------|
| Level 1 | Grade 1 | FF Starter + FF 1 | Pre-A1 |
| Level 2 | Grade 2 | FF 2 | Pre-A1 to A1 |
| Level 3 | Grade 3 | FF 3 | A1 |
| Level 4 | Grade 4 | FF 4 | A1 to A2 |
| Level 5 | Grade 5 | FF 5 | A2 |

### Priority: Build Level 2-3 first (FF Book 2 and 3), then expand.

### Content Structure per FF Book
Each FF book has approximately **15 units**. Each unit contains:
- **Vocabulary**: 8-12 new words per unit (with images/illustrations)
- **Grammar**: 1-2 grammar points per unit
- **Phonics**: Letter sounds, blends, digraphs
- **Skills Time**: Reading passage + comprehension, Writing exercise
- **Song/Chant**: For listening and repetition
- **Story**: Short narrative for reading practice
- **Review**: Every 3 units

### Content Data Format
All content is stored as pre-generated JSON in `/content/` directory:

```
content/
├── ff2/
│   ├── meta.json              # Book metadata, unit list
│   ├── unit-01/
│   │   ├── vocabulary.json    # Words, definitions, example sentences
│   │   ├── grammar.json       # Grammar rules, examples
│   │   ├── phonics.json       # Sounds, word lists
│   │   ├── reading.json       # Passages, comprehension questions
│   │   ├── listening.json     # Scripts for TTS, comprehension questions
│   │   ├── speaking.json      # Prompts, expected responses, pronunciation targets
│   │   ├── writing.json       # Fill-in-blank, sentence ordering, short writing prompts
│   │   └── exercises.json     # Mixed quiz bank (all skills)
│   ├── unit-02/
│   │   └── ...
│   └── review-01/             # Review for units 1-3
│       └── exercises.json
├── ff3/
│   └── ... (same structure)
└── shared/
    ├── word-bank.json         # Master vocabulary across all levels
    └── phonics-map.json       # Complete phonics progression
```

### Exercise JSON Schema

```typescript
interface Exercise {
  id: string;                          // e.g., "ff2-u01-vocab-001"
  unit: number;
  book: "ff2" | "ff3" | "ff4" | "ff5";
  skill: "listening" | "speaking" | "reading" | "writing";
  type: ExerciseType;
  difficulty: 1 | 2 | 3;              // within the unit
  question: string;                    // Display text or TTS script
  options?: string[];                  // For multiple choice
  correctAnswer: string | string[];    // Single or multiple correct
  hint?: string;
  image?: string;                      // Path to illustration
  audio?: string;                      // TTS text (rendered by Web Speech API)
  phonics?: string;                    // IPA or simplified phonics
  points: number;                      // XP earned (5, 10, 15)
}

type ExerciseType =
  // Vocabulary
  | "word-match"           // Match word to image/definition
  | "word-spell"           // Type the word from audio/image
  | "word-scramble"        // Unscramble letters
  // Grammar
  | "fill-blank"           // Complete the sentence
  | "sentence-order"       // Arrange words into sentence
  | "pick-correct"         // Choose correct grammar form
  // Listening
  | "listen-pick"          // Listen and choose correct answer
  | "listen-type"          // Listen and type what you hear
  | "listen-match"         // Match audio to images
  // Speaking
  | "repeat-word"          // Say the word, check pronunciation
  | "repeat-sentence"      // Say the sentence
  | "answer-question"      // Listen to question, speak answer
  // Reading
  | "read-comprehension"   // Read passage, answer questions
  | "read-true-false"      // True/false about a passage
  | "read-match"           // Match sentences to meanings
  // Writing
  | "type-word"            // Type a word from prompt
  | "type-sentence"        // Write a short sentence
  | "fix-sentence"         // Find and fix errors
  // Phonics
  | "sound-match"          // Match sound to letter(s)
  | "rhyme-pick"           // Pick the rhyming word
  | "blend-read"           // Read blended sounds
```

---

## App Features & UX

### 1. Home Screen
- Character mascot (friendly animal) with greeting
- Current level & unit progress bar
- Daily streak counter (flame icon)
- XP total with level badge
- "Start Lesson" button (big, obvious)
- Quick access: Practice (random review), Vocabulary Book

### 2. Lesson Flow (Duolingo-style)
Each lesson = 10-15 exercises from the current unit, mixed across skills:
1. Progress bar at top (shows X/15 exercises)
2. Heart system: Start with 5 hearts, lose 1 per wrong answer
3. Exercise presented one at a time
4. Correct → celebration animation + XP popup (+5, +10)
5. Wrong → show correct answer, gentle encouragement
6. End of lesson → summary screen (XP earned, accuracy %, streak)

### 3. Skill-Specific UX

**Listening:**
- Tap speaker icon → Web Speech API reads the text (slow, clear, child voice if available)
- "Repeat" button to hear again
- Child selects answer (image or text options)

**Speaking:**
- App shows word/sentence to say
- Tap microphone → Web Speech Recognition listens
- Compare recognized text to expected answer (fuzzy matching for kids)
- Green checkmark or "Try again" with pronunciation hint

**Reading:**
- Short passage displayed with large, clear font
- Key vocabulary highlighted (tap to hear pronunciation)
- Comprehension questions follow

**Writing:**
- On-screen keyboard optimized for kids (large keys)
- Letter/word hints available
- Auto-check spelling with tolerance for minor errors

### 4. Gamification
- **XP Points**: 5-15 per correct answer based on difficulty
- **Streaks**: Daily login + complete 1 lesson = maintain streak
- **Hearts**: 5 per session, recharge over time or after review
- **Level badges**: Complete all units in a book = earn badge
- **Stars per unit**: ⭐⭐⭐ based on accuracy (< 70% = 1, 70-90% = 2, > 90% = 3)
- **Sticker collection**: Earn stickers for milestones (optional reward system)

### 5. Progress Tracking
- Per-unit completion percentage
- Per-skill accuracy (Listening 85%, Speaking 72%, etc.)
- Weak areas highlighted for review
- Parent view: simple dashboard (no auth needed, just a settings page)

---

## Database Schema (SQLite)

```sql
-- User profile (1-2 kids)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'bear',
  current_book TEXT DEFAULT 'ff2',
  current_unit INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exercise attempts
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  exercise_id TEXT NOT NULL,        -- e.g., "ff2-u01-vocab-001"
  skill TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  answer_given TEXT,
  time_spent_seconds INTEGER,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Unit progress
CREATE TABLE unit_progress (
  user_id INTEGER REFERENCES users(id),
  book TEXT NOT NULL,
  unit INTEGER NOT NULL,
  stars INTEGER DEFAULT 0,          -- 0-3
  completed BOOLEAN DEFAULT FALSE,
  best_accuracy REAL DEFAULT 0,
  exercises_done INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, book, unit)
);

-- Daily streaks
CREATE TABLE daily_log (
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Vocabulary mastery (spaced repetition tracking)
CREATE TABLE word_mastery (
  user_id INTEGER REFERENCES users(id),
  word TEXT NOT NULL,
  book TEXT NOT NULL,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0,  -- 0=new, 1=learning, 2=familiar, 3=mastered
  next_review DATE,
  PRIMARY KEY (user_id, word, book)
);
```

---

## Project Structure

```
english-buddy/
├── CLAUDE.md                    # This file
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── images/
│   │   ├── mascot/              # Character mascot SVGs
│   │   ├── stickers/            # Reward stickers
│   │   └── exercises/           # Illustrations for exercises
│   └── sounds/
│       ├── correct.mp3          # Success sound effect
│       ├── wrong.mp3            # Wrong answer sound
│       └── levelup.mp3          # Level up celebration
├── content/                     # Pre-generated lesson content (JSON)
│   ├── ff2/
│   ├── ff3/
│   └── shared/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (kid-friendly theme)
│   │   ├── page.tsx             # Home screen
│   │   ├── lesson/
│   │   │   └── [bookId]/[unitId]/page.tsx  # Lesson flow
│   │   ├── practice/
│   │   │   └── page.tsx         # Random review mode
│   │   ├── vocabulary/
│   │   │   └── page.tsx         # Word book / dictionary
│   │   ├── progress/
│   │   │   └── page.tsx         # Progress dashboard
│   │   └── api/
│   │       ├── progress/route.ts
│   │       ├── attempt/route.ts
│   │       └── user/route.ts
│   ├── components/
│   │   ├── exercises/           # Exercise type components
│   │   │   ├── WordMatch.tsx
│   │   │   ├── FillBlank.tsx
│   │   │   ├── ListenPick.tsx
│   │   │   ├── SpeakRepeat.tsx
│   │   │   ├── ReadComprehension.tsx
│   │   │   ├── TypeWord.tsx
│   │   │   └── ExerciseRouter.tsx  # Routes to correct component by type
│   │   ├── ui/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── HeartDisplay.tsx
│   │   │   ├── XPPopup.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── MascotBubble.tsx   # Mascot with speech bubble
│   │   │   └── CelebrationAnimation.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       └── BottomNav.tsx
│   ├── lib/
│   │   ├── db.ts               # SQLite connection & queries
│   │   ├── content.ts          # Load lesson content from JSON
│   │   ├── speech.ts           # Web Speech API helpers (TTS + recognition)
│   │   ├── scoring.ts          # XP calculation, streak logic
│   │   ├── fuzzyMatch.ts       # Tolerant answer checking for kids
│   │   └── lessonEngine.ts     # Select & sequence exercises for a lesson
│   ├── hooks/
│   │   ├── useSpeech.ts        # TTS hook
│   │   ├── useSpeechRecognition.ts  # Speech-to-text hook
│   │   ├── useExercise.ts      # Exercise state management
│   │   └── useProgress.ts      # Progress tracking hook
│   └── types/
│       ├── exercise.ts         # Exercise interfaces
│       ├── progress.ts         # Progress interfaces
│       └── user.ts             # User interfaces
├── scripts/
│   └── generate-content.ts     # Script to help structure content generation
├── db/
│   └── english-buddy.db        # SQLite database file
└── ecosystem.config.js          # PM2 config for Mac Mini deployment
```

---

## Design Guidelines

### Visual Style
- **Colors**: Bright, cheerful palette
  - Primary: `#4CAF50` (green — Duolingo-inspired)
  - Secondary: `#FF9800` (orange — warmth)
  - Accent: `#2196F3` (blue — trust)
  - Error: `#F44336` (red — gentle)
  - Background: `#FFF8E1` (warm cream)
  - Card: `#FFFFFF` with soft shadow
- **Typography**: 
  - Headings: `Nunito` or `Quicksand` (rounded, friendly)
  - Body: `Inter` (clean, readable)
  - Minimum font size: 18px (kids need larger text)
- **Touch targets**: Minimum 48x48px (Apple HIG), prefer 56x56px for kids
- **Animations**: Bouncy, playful — use spring physics in Framer Motion
- **Icons**: Rounded, filled style (Lucide or custom SVG)

### Responsive Breakpoints
- **iPad (primary)**: 768px - 1024px
- **iPhone**: 375px - 428px
- **Desktop**: 1024px+ (for parent dashboard)

### Accessibility
- High contrast text (AA minimum)
- Large, clear buttons
- Audio feedback for all interactions
- No time pressure on exercises (except optional speed challenges)

---

## Content Generation Strategy

Since all content is pre-generated, use Claude Code to create content systematically:

### Phase 1: FF Book 2 (Priority)
1. Generate `content/ff2/meta.json` with all 15 unit titles and topics
2. For each unit, generate all JSON files following the schema above
3. Aim for 20-30 exercises per unit across all skills and types
4. Include 3 difficulty levels within each unit
5. Generate review exercises for every 3 units

### Phase 2: FF Book 3
Same structure as Phase 2, building on FF2 vocabulary and grammar.

### Content Quality Rules
- Vocabulary must match the actual FF textbook word lists
- Grammar points must follow FF progression (don't introduce future tense in Level 2)
- All sentences should be age-appropriate and culturally neutral
- Reading passages: max 50 words for Level 2, max 80 words for Level 3
- Use British English spelling (FF is Oxford/British) unless noted otherwise
- Include phonics focus matching FF phonics syllabus

### FF2 Unit Topics (approximate)
1. What's this? (school things)
2. They're happy (feelings/emotions)
3. I can ride a bike (abilities)
4. This is my family (family members)
5. Where's the ball? (prepositions)
6. Let's play! (toys and games)
7. We've got a pet (animals)
8. It's hot today (weather)
9. What's for lunch? (food)
10. Lunchtime! (food & drink continued)
11. I get up at seven (daily routines)
12. What day is it today? (days of week)
13. Look at the animals! (zoo animals)
14. I'm wearing a T-shirt (clothes)
15. It's Fun Day! (review & celebration)

### FF3 Unit Topics (approximate)
1. They're from Australia (countries)
2. We've got English! (school subjects)
3. My family tree (extended family)
4. We're having a great time! (activities)
5. The tiger is big! (wild animals, comparatives)
6. Where do you live? (homes, rooms)
7. It's mine! (possessives)
8. What's the time? (telling time)
9. I'd like a glass of water (food, would like)
10. We're going on holiday! (transport, places)
11. He wasn't at school (past simple was/were)
12. What happened? (past simple regular)
13. We went to the beach (past simple irregular)
14. My hero! (describing people)
15. Going to the shops (money, shopping)

---

## Deployment Instructions (Mac Mini)

### Prerequisites
```bash
# Install Node.js (LTS)
brew install node

# Install PM2 globally
npm install -g pm2
```

### Setup
```bash
# Clone/copy project to Mac Mini
cd ~/english-buddy

# Install dependencies
npm install

# Build the app
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Auto-start on boot
pm2 save
pm2 startup
```

### PM2 Config (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'english-buddy',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0'    // Accept connections from local network
    },
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### Access from iPad
1. Find Mac Mini's local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. On iPad Safari, go to: `http://<mac-mini-ip>:3000`
3. Optional: Add to Home Screen for app-like experience

---

## Development Phases

### Phase 1: Core App Shell (Week 1)
- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up SQLite database with schema
- [ ] Create app layout (AppShell, BottomNav, theme)
- [ ] Build Home Screen with mascot, XP, streak display
- [ ] Implement user selection (1-2 profiles)

### Phase 2: Exercise Engine (Week 2)
- [ ] Build ExerciseRouter component
- [ ] Implement 4-5 core exercise types:
  - WordMatch (vocabulary)
  - FillBlank (grammar)
  - ListenPick (listening + Web Speech TTS)
  - SpeakRepeat (speaking + Web Speech Recognition)
  - TypeWord (writing)
- [ ] Build lesson flow: progress bar, hearts, XP popup
- [ ] Implement answer checking with fuzzy matching

### Phase 3: Content Generation (Week 2-3)
- [ ] Generate FF2 complete content (15 units × all skills)
- [ ] Generate FF3 complete content
- [ ] Validate all JSON files against schema
- [ ] Test exercise quality and age-appropriateness

### Phase 4: Gamification & Polish (Week 3)
- [ ] Streak system with daily tracking
- [ ] Star ratings per unit
- [ ] Celebration animations (confetti, mascot reactions)
- [ ] Sound effects (correct/wrong/levelup)
- [ ] Progress dashboard for parents

### Phase 5: Remaining Exercise Types (Week 4)
- [ ] SentenceOrder, WordScramble
- [ ] ReadComprehension, ReadTrueFalse
- [ ] ListenType, ListenMatch
- [ ] FixSentence, TypeSentence
- [ ] SoundMatch, RhymePick (phonics)

### Phase 6: Deploy & Test (Week 4)
- [ ] Build production bundle
- [ ] Deploy to Mac Mini with PM2
- [ ] Test on iPad Safari
- [ ] Test Speech APIs on iOS Safari
- [ ] Fix responsive issues
- [ ] User testing with kids

---

## Important Notes

### Web Speech API on iOS Safari
- `webkitSpeechRecognition` is supported on iOS Safari 14.5+
- Requires user gesture (tap) to activate microphone
- Set `lang: 'en-GB'` for British English recognition
- `speechSynthesis` works well — use `en-GB` voice for consistency with FF curriculum
- Test thoroughly: iOS may require HTTPS for Speech Recognition in production (local HTTP is fine for development)

### Content Copyright
- Do NOT copy text directly from Family and Friends textbooks
- Use the curriculum structure (topics, grammar points, vocabulary lists) as a guide
- Generate original exercises inspired by the FF methodology
- All reading passages and sentences must be original

### Offline-First Design
- All content is static JSON — no network needed for exercises
- SQLite stores all progress locally
- Web Speech API works offline for TTS (voices are on-device)
- Speech Recognition may need network on some devices — provide fallback (type answer instead)
