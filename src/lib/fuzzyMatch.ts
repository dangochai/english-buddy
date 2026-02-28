/**
 * Fuzzy match utilities for tolerant answer checking.
 * Used across TypeWord, SpeakRepeat, and any future exercise types.
 */

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Fuzzy single-word match: allow 1 typo for words ≤5 chars, 2 typos for longer.
 */
export function isFuzzyMatch(input: string, target: string): boolean {
  const a = input.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  if (a === b) return true;
  const maxDist = b.length <= 5 ? 1 : 2;
  return levenshtein(a, b) <= maxDist;
}

/**
 * Normalise a string for comparison: lowercase, trim, remove punctuation.
 */
export function normalizeText(s: string): string {
  return s.toLowerCase().trim().replace(/[.,!?'"]/g, "");
}

/**
 * Word-level diff result between a spoken/typed transcript and the correct answer.
 * Returns one entry per word in the correct answer.
 */
export interface WordDiff {
  word: string;      // correct word
  heard: string;     // what was heard/typed (empty string if missing)
  correct: boolean;
}

/**
 * Compare transcript against correctAnswer word by word using fuzzy matching.
 * Extra words in transcript beyond correctAnswer length are ignored.
 */
export function wordDiff(transcript: string, correctAnswer: string): WordDiff[] {
  const expectedWords = normalizeText(correctAnswer).split(/\s+/).filter(Boolean);
  const heardWords = normalizeText(transcript).split(/\s+/).filter(Boolean);

  return expectedWords.map((expected, i) => {
    const heard = heardWords[i] ?? "";
    return {
      word: expected,
      heard,
      correct: isFuzzyMatch(heard, expected),
    };
  });
}
