"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";

interface FillBlankProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
}

export default function FillBlank({ exercise, onAnswer }: FillBlankProps) {
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

  // Replace ___ with a highlighted blank
  const parts = exercise.question.split("___");

  return (
    <div className="flex flex-col gap-6">
      {/* Sentence with blank */}
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="font-heading text-xl font-bold text-text">
          {parts[0]}
          <span className="mx-1 inline-block min-w-[80px] rounded-lg border-2 border-dashed border-accent bg-accent/10 px-3 py-1 text-accent">
            {selectedAnswer ?? "___"}
          </span>
          {parts[1]}
        </p>
      </div>

      {exercise.hint && (
        <p className="text-center text-sm text-text-light">
          💡 {exercise.hint}
        </p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options?.map((option) => {
          let style = "border-gray-200 bg-white";
          if (showResult && option === exercise.correctAnswer) {
            style = "border-primary bg-primary/10 text-primary";
          } else if (
            showResult &&
            selectedAnswer === option &&
            option !== exercise.correctAnswer
          ) {
            style = "border-error bg-error/10 text-error";
          }

          return (
            <motion.button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`rounded-xl border-2 p-4 text-center text-lg font-semibold transition-all ${style}`}
              whileHover={!showResult ? { scale: 1.03 } : {}}
              whileTap={!showResult ? { scale: 0.97 } : {}}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
