"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface TypeWordProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

// Simple fuzzy match: allow 1 typo for words ≤5 chars, 2 typos for longer
function isFuzzyMatch(input: string, target: string): boolean {
  const a = input.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  if (a === b) return true;
  const maxDist = b.length <= 5 ? 1 : 2;
  // Levenshtein distance
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
  return dp[a.length][b.length] <= maxDist;
}

export default function TypeWord({ exercise, onAnswer, initialAnswer }: TypeWordProps) {
  const [inputValue, setInputValue] = useState(initialAnswer ?? "");
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialAnswer != null
      ? isFuzzyMatch(initialAnswer, String(Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer[0] : exercise.correctAnswer))
      : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  const firstLetter = correctAnswer[0].toUpperCase();

  useEffect(() => {
    if (!initialAnswer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [initialAnswer]);

  // Notify parent when result is shown
  useEffect(() => {
    if (showResult && inputValue) {
      const correct = isFuzzyMatch(inputValue, correctAnswer);
      onAnswer(correct, inputValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const handleSubmit = () => {
    if (!inputValue.trim() || showResult) return;
    const correct = isFuzzyMatch(inputValue, correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) playCorrectSound();
    else playWrongSound();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex flex-col gap-5">
      {exercise.image && (
        <motion.div
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white text-7xl shadow-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {exercise.image}
        </motion.div>
      )}

      <div className="text-center">
        <p className="font-heading text-xl font-bold text-text">{exercise.question}</p>
        {!showResult && (
          <p className="mt-1 text-sm text-text-light">
            💡 First letter: <span className="font-bold text-accent">{firstLetter}</span>
            {exercise.hint && ` · ${exercise.hint}`}
          </p>
        )}
        {showResult && isCorrect && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Well done! 🎉
          </motion.p>
        )}
        {showResult && !isCorrect && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            The answer is: {correctAnswer}
          </motion.p>
        )}
      </div>

      <div
        className={`rounded-2xl border-2 bg-white p-4 transition-colors ${
          showResult
            ? isCorrect
              ? "border-primary"
              : "border-error"
            : "border-gray-200 focus-within:border-accent"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => !showResult && setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={showResult}
          placeholder="Type your answer…"
          className="w-full bg-transparent text-center text-xl font-semibold text-text outline-none placeholder:text-gray-300"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>

      {!showResult && (
        <motion.button
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className={`min-h-[56px] w-full rounded-2xl py-4 text-lg font-bold transition-all ${
            inputValue.trim()
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          whileTap={inputValue.trim() ? { scale: 0.97 } : {}}
        >
          Check
        </motion.button>
      )}
    </div>
  );
}
