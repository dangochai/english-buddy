# EnglishBuddy

Duolingo-style English learning web app for primary school children (grades 1-5), following the Oxford **Family and Friends** (2nd Edition) ESL curriculum.

## Quick Start

```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Next.js API Routes + SQLite (better-sqlite3 + Drizzle ORM)
- **Audio**: Web Speech API (TTS for listening, Speech Recognition for speaking)
- **Content**: Pre-generated JSON — zero runtime AI cost

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home screen
│   ├── lesson/[bookId]/[unitId]/  # Lesson flow
│   ├── progress/           # Progress dashboard
│   └── api/                # API routes (user, exercises, attempts)
├── components/
│   ├── exercises/          # Exercise type components (WordMatch, FillBlank, ...)
│   ├── ui/                 # Shared UI (ProgressBar, Hearts, XPPopup)
│   └── layout/             # AppShell, BottomNav
├── lib/                    # DB, content loader, utilities
├── hooks/                  # React hooks (speech, exercises, progress)
└── types/                  # TypeScript interfaces
content/
├── ff2/                    # Family and Friends Book 2 (15 units)
├── ff3/                    # Family and Friends Book 3 (15 units)
└── shared/                 # Shared word bank, phonics map
```

## Development Phases

### Phase 1: MVP Core Shell — DONE
- [x] Next.js 15 + TypeScript + Tailwind CSS + Framer Motion setup
- [x] SQLite database with Drizzle ORM (users, attempts, unit_progress, daily_log)
- [x] Home screen (mascot, XP/streak stats, unit list, "Start Lesson" button)
- [x] Bottom navigation (Home, Learn, Progress)
- [x] Lesson flow with progress bar, hearts, XP popup, completion screen
- [x] WordMatch + FillBlank exercise components
- [x] Sample FF2 Unit 1 content (10 exercises)
- [x] API routes for user, exercises, attempt recording

### Phase 2: MVP Polish & QA — DONE
- [x] Web Speech API (TTS) for listening exercises — `useSpeech` hook with en-GB voice
- [x] Persist lesson progress (XP, stars, unit completion) to database — `/api/progress`
- [x] Exit confirmation modal + answer review screen after lesson
- [x] Load unit titles dynamically from `meta.json` — `/api/books/[bookId]`
- [x] Larger touch targets (min 56px), sound effects (Web Audio API tones)
- [x] Lock units without content (non-clickable, dimmed)
- [x] Streak calculation and daily log in `/api/progress`
- [x] Case-insensitive answer matching, correct answer shown on wrong

### Phase 3: More Exercise Types — NEXT
Builds on current WordMatch + FillBlank foundation. Each type gets its own component.
- [ ] TypeWord — text input with letter hints, fuzzy matching for typos
- [ ] SentenceOrder — drag-and-drop to arrange words (touch-friendly)
- [ ] WordScramble — unscramble letters to form a word
- [ ] SpeakRepeat — Web Speech Recognition with microphone UI, fallback to typing
- [ ] ReadComprehension — passage display + multiple-choice questions

### Phase 4: FF2 Content Generation (Units 1-15)
All content is pre-generated JSON, no runtime AI. ~300 total exercises.
- [ ] Unit 1-5: Vocabulary + grammar + listening exercises (20-30 each)
- [ ] Unit 6-10: Add reading passages + phonics exercises
- [ ] Unit 11-15: Full coverage (all skill types)
- [ ] Review exercises for units 1-3, 4-6, 7-9, 10-12, 13-15
- [ ] Validate: British English spelling, age-appropriate, FF2 curriculum-aligned

### Phase 5: Gamification & Polish
- [ ] Confetti animation on lesson complete (Framer Motion)
- [ ] Mascot reactions (happy on correct, encouraging on wrong)
- [ ] Star ratings displayed on unit list (from DB `unit_progress`)
- [ ] Heart recharge (timer-based or after reviewing wrong answers)
- [ ] Vocabulary book page — browse words by unit, tap to hear pronunciation
- [ ] Progress dashboard — per-skill accuracy chart, weekly XP graph

### Phase 6: FF3 Content + Advanced Exercises
- [ ] Generate FF3 Units 1-15 (same JSON structure as FF2)
- [ ] Cross-reference vocabulary progression FF2 → FF3
- [ ] ListenType, ListenMatch exercise components
- [ ] ReadTrueFalse, ReadMatch exercise components
- [ ] FixSentence, TypeSentence exercise components
- [ ] SoundMatch, RhymePick, BlendRead (phonics) exercise components

### Phase 7: Multi-user + Parent Dashboard
- [ ] User selection screen (1-2 kid profiles)
- [ ] Avatar picker
- [ ] Parent dashboard (simple stats view, no auth needed)
- [ ] Spaced repetition for vocabulary (`word_mastery` table)

### Phase 8: Deploy & Test on iPad
- [ ] Production build + optimize bundle size
- [ ] Deploy to Mac Mini with PM2 (`ecosystem.config.js`)
- [ ] Test on iPad Safari — touch targets, Web Speech API, responsive layout
- [ ] Test on iPhone Safari
- [ ] PWA setup via `@serwist/next` (installable on home screen)
- [ ] User testing with kids — observe, iterate

## Deployment (Local Mac Mini)

```bash
pnpm build
pm2 start ecosystem.config.js
# Access from iPad: http://<mac-mini-ip>:3000
```

## License

Private project — not for distribution.
