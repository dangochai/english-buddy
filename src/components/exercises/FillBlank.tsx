"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface FillBlankProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

export default function FillBlank({ exercise, onAnswer, initialAnswer }: FillBlankProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer ?? null);
  const [showResult, setShowResult] = useState(!!initialAnswer);

  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  const handleSelect = (option: string) => {
    if (showResult) return;

    setSelectedAnswer(option);
    setShowResult(true);

    const isCorrect = option.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Notify parent of answer
  useEffect(() => {
    if (showResult && selectedAnswer !== null) {
      const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
      onAnswer(isCorrect, selectedAnswer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  // Replace ___ with a highlighted blank
  const parts = exercise.question.split("___");

  return (
    <div className="flex flex-col gap-5">
      {/* Image if available */}
      {exercise.image && (
        <motion.div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-6xl shadow-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {exercise.image}
        </motion.div>
      )}

      {/* Sentence with blank */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="font-heading text-xl font-bold text-text">
          {parts[0]}
          <span className={`mx-1 inline-block min-w-[80px] rounded-lg border-2 border-dashed px-3 py-1 ${
            showResult && selectedAnswer
              ? selectedAnswer.toLowerCase() === correctAnswer.toLowerCase()
                ? "border-primary bg-primary/10 text-primary"
                : "border-error bg-error/10 text-error"
              : "border-accent bg-accent/10 text-accent"
          }`}>
            {selectedAnswer ?? "___"}
          </span>
          {parts[1]}
        </p>
      </div>

      {exercise.hint && !showResult && (
        <p className="text-center text-sm text-text-light">
          💡 {exercise.hint}
        </p>
      )}

      {/* Feedback */}
      {showResult && selectedAnswer?.toLowerCase() !== correctAnswer.toLowerCase() && (
        <motion.p
          className="text-center text-base font-semibold text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          The answer is: {correctAnswer}
        </motion.p>
      )}
      {showResult && selectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() && (
        <motion.p
          className="text-center text-base font-semibold text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Well done! 🎉
        </motion.p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options?.map((option) => {
          let style = "border-gray-200 bg-white";
          if (showResult && option.toLowerCase() === correctAnswer.toLowerCase()) {
            style = "border-primary bg-primary/10 text-primary";
          } else if (
            showResult &&
            selectedAnswer === option &&
            option.toLowerCase() !== correctAnswer.toLowerCase()
          ) {
            style = "border-error bg-error/10 text-error";
          }

          return (
            <motion.button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`min-h-[60px] rounded-2xl border-2 px-4 py-5 text-center text-lg font-semibold transition-all ${style}`}
              whileHover={!showResult ? { scale: 1.03 } : {}}
              whileTap={!showResult ? { scale: 0.95 } : {}}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
