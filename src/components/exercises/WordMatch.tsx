"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";

interface WordMatchProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
}

export default function WordMatch({ exercise, onAnswer }: WordMatchProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;

    setSelectedAnswer(option);
    setShowResult(true);

    const isCorrect = option === exercise.correctAnswer;

    setTimeout(() => {
      onAnswer(isCorrect, option);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1200);
  };

  const getOptionStyle = (option: string) => {
    if (!showResult || selectedAnswer !== option) {
      if (showResult && option === exercise.correctAnswer) {
        return "border-primary bg-primary/10 text-primary";
      }
      return "border-gray-200 bg-white hover:border-accent hover:bg-accent/5";
    }

    if (option === exercise.correctAnswer) {
      return "border-primary bg-primary/10 text-primary";
    }
    return "border-error bg-error/10 text-error";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="text-center">
        <p className="font-heading text-xl font-bold text-text">
          {exercise.question}
        </p>
        {exercise.hint && (
          <p className="mt-2 text-sm text-text-light">
            💡 Hint: {exercise.hint}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options?.map((option) => (
          <motion.button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={showResult}
            className={`rounded-xl border-2 p-4 text-center text-lg font-semibold transition-all ${getOptionStyle(option)}`}
            whileHover={!showResult ? { scale: 1.03 } : {}}
            whileTap={!showResult ? { scale: 0.97 } : {}}
          >
            {option}
            {showResult && option === exercise.correctAnswer && (
              <motion.span
                className="ml-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✅
              </motion.span>
            )}
            {showResult &&
              selectedAnswer === option &&
              option !== exercise.correctAnswer && (
                <motion.span
                  className="ml-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ❌
                </motion.span>
              )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
