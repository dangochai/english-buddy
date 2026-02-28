"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface SentenceOrderProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

export default function SentenceOrder({ exercise, onAnswer, initialAnswer }: SentenceOrderProps) {
  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  // options = word bank (shuffled words provided in JSON)
  const wordBank = exercise.options ?? [];

  const [selected, setSelected] = useState<string[]>(() => {
    if (initialAnswer) return initialAnswer.split(" ");
    return [];
  });
  const [available, setAvailable] = useState<string[]>(() => {
    if (initialAnswer) {
      const usedWords = initialAnswer.split(" ");
      const remaining = [...wordBank];
      for (const w of usedWords) {
        const idx = remaining.indexOf(w);
        if (idx !== -1) remaining.splice(idx, 1);
      }
      return remaining;
    }
    return [...wordBank];
  });
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialAnswer != null
      ? initialAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
      : null
  );

  // Notify parent when result shown
  useEffect(() => {
    if (showResult && selected.length > 0) {
      const answer = selected.join(" ");
      const correct = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      onAnswer(correct, answer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const handleSelectWord = (word: string, idx: number) => {
    if (showResult) return;
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
    setSelected((prev) => [...prev, word]);
  };

  const handleRemoveWord = (word: string, idx: number) => {
    if (showResult) return;
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    setAvailable((prev) => [...prev, word]);
  };

  const handleCheck = () => {
    if (selected.length === 0 || showResult) return;
    const answer = selected.join(" ");
    const correct = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) playCorrectSound();
    else playWrongSound();
  };

  const handleReset = () => {
    setSelected([]);
    setAvailable([...wordBank]);
  };

  return (
    <div className="flex flex-col gap-5">
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

      {/* Sentence building area */}
      <div
        className={`min-h-[72px] rounded-2xl border-2 bg-white p-3 transition-colors ${
          showResult
            ? isCorrect
              ? "border-primary bg-primary/5"
              : "border-error bg-error/5"
            : "border-dashed border-accent/40"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 && (
            <p className="text-sm text-gray-300 self-center">Tap words below to build the sentence…</p>
          )}
          <AnimatePresence>
            {selected.map((word, idx) => (
              <motion.button
                key={`${word}-${idx}`}
                onClick={() => handleRemoveWord(word, idx)}
                disabled={showResult}
                className={`rounded-xl border-2 px-3 py-2 text-base font-semibold transition-all ${
                  showResult
                    ? isCorrect
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-error bg-error/10 text-error"
                    : "border-accent bg-accent/10 text-accent"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((word, idx) => (
          <motion.button
            key={`${word}-${idx}`}
            onClick={() => handleSelectWord(word, idx)}
            disabled={showResult}
            className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-base font-semibold text-text transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-40"
            whileHover={!showResult ? { scale: 1.05 } : {}}
            whileTap={!showResult ? { scale: 0.95 } : {}}
          >
            {word}
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
            disabled={selected.length === 0}
            className={`min-h-[56px] flex-1 rounded-2xl py-4 text-lg font-bold transition-all ${
              selected.length > 0
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            whileTap={selected.length > 0 ? { scale: 0.97 } : {}}
          >
            Check
          </motion.button>
        </div>
      )}
    </div>
  );
}
