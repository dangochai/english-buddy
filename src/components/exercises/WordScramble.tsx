"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { useSpeech } from "@/hooks/useSpeech";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface WordScrambleProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

// Fisher-Yates shuffle with seed-like stability (deterministic per exercise id)
function scrambleLetters(word: string, seed: string): string[] {
  const letters = word.toUpperCase().split("");
  // Simple deterministic shuffle based on seed length
  const n = seed.length;
  for (let i = letters.length - 1; i > 0; i--) {
    const j = (i * n + 7) % (i + 1);
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Ensure result is actually scrambled (not same as original)
  if (letters.join("") === word.toUpperCase()) {
    [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
  }
  return letters;
}

export default function WordScramble({ exercise, onAnswer, initialAnswer }: WordScrambleProps) {
  const { speak } = useSpeech();

  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  const scrambled = useMemo(
    () => scrambleLetters(correctAnswer, exercise.id),
    [correctAnswer, exercise.id]
  );

  const [available, setAvailable] = useState<Array<{ letter: string; idx: number }>>(() => {
    if (initialAnswer) return [];
    return scrambled.map((letter, idx) => ({ letter, idx }));
  });
  const [typed, setTyped] = useState<Array<{ letter: string; idx: number }>>(() => {
    if (initialAnswer) {
      return initialAnswer.toUpperCase().split("").map((letter, idx) => ({ letter, idx }));
    }
    return [];
  });
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialAnswer != null
      ? initialAnswer.toLowerCase() === correctAnswer.toLowerCase()
      : null
  );

  // Notify parent
  useEffect(() => {
    if (showResult && typed.length > 0) {
      const answer = typed.map((t) => t.letter).join("").toLowerCase();
      const correct = answer === correctAnswer.toLowerCase();
      onAnswer(correct, answer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const handleAdd = (item: { letter: string; idx: number }) => {
    if (showResult) return;
    setAvailable((prev) => prev.filter((a) => a.idx !== item.idx));
    setTyped((prev) => [...prev, item]);
  };

  const handleRemove = (item: { letter: string; idx: number }) => {
    if (showResult) return;
    setTyped((prev) => prev.filter((t) => t.idx !== item.idx));
    setAvailable((prev) => [...prev, item].sort((a, b) => a.idx - b.idx));
  };

  const handleCheck = () => {
    if (typed.length < correctAnswer.length || showResult) return;
    const answer = typed.map((t) => t.letter).join("").toLowerCase();
    const correct = answer === correctAnswer.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      playCorrectSound();
      if (exercise.audio) speak(exercise.audio);
    } else {
      playWrongSound();
    }
  };

  const handleReset = () => {
    setTyped([]);
    setAvailable(scrambled.map((letter, idx) => ({ letter, idx })));
  };

  return (
    <div className="flex flex-col gap-5">
      {exercise.image && (
        <motion.div
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white text-7xl shadow-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {exercise.image}
        </motion.div>
      )}

      <div className="text-center">
        <p className="font-heading text-xl font-bold text-text">{exercise.question}</p>
        {exercise.hint && !showResult && (
          <p className="mt-1 text-sm text-text-light">💡 {exercise.hint}</p>
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

      {/* Answer area — typed letters */}
      <div
        className={`flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 bg-white p-3 transition-colors ${
          showResult
            ? isCorrect
              ? "border-primary bg-primary/5"
              : "border-error bg-error/5"
            : "border-dashed border-accent/40"
        }`}
      >
        {typed.length === 0 ? (
          <p className="text-sm text-gray-300">Tap letters to spell the word…</p>
        ) : (
          <AnimatePresence>
            {typed.map((item, pos) => (
              <motion.button
                key={`typed-${item.idx}`}
                onClick={() => handleRemove(item)}
                disabled={showResult}
                className={`flex h-11 w-10 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${
                  showResult
                    ? isCorrect
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-error bg-error/10 text-error"
                    : "border-accent bg-accent/10 text-accent"
                }`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {item.letter}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Scrambled letter bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((item) => (
          <motion.button
            key={`avail-${item.idx}`}
            onClick={() => handleAdd(item)}
            disabled={showResult}
            className="flex h-11 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-lg font-bold text-text transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-30"
            whileHover={!showResult ? { scale: 1.1 } : {}}
            whileTap={!showResult ? { scale: 0.9 } : {}}
          >
            {item.letter}
          </motion.button>
        ))}
      </div>

      {!showResult && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="min-h-[56px] flex-none rounded-2xl border-2 border-gray-200 px-5 py-4 font-semibold text-text-light hover:bg-gray-50"
          >
            Reset
          </button>
          <motion.button
            onClick={handleCheck}
            disabled={typed.length < correctAnswer.length}
            className={`min-h-[56px] flex-1 rounded-2xl py-4 text-lg font-bold transition-all ${
              typed.length >= correctAnswer.length
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            whileTap={typed.length >= correctAnswer.length ? { scale: 0.97 } : {}}
          >
            Check
          </motion.button>
        </div>
      )}
    </div>
  );
}
