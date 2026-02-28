"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { useSpeech } from "@/hooks/useSpeech";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface WordMatchProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

export default function WordMatch({ exercise, onAnswer, initialAnswer }: WordMatchProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer ?? null);
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const { speak } = useSpeech();

  const isListening = exercise.type === "listen-pick";

  // Auto-play audio for listening exercises
  useEffect(() => {
    if (isListening && exercise.audio) {
      const timer = setTimeout(() => speak(exercise.audio!), 400);
      return () => clearTimeout(timer);
    }
  }, [exercise.id, isListening, exercise.audio, speak]);

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

  // Expose result to parent
  useEffect(() => {
    if (showResult && selectedAnswer !== null) {
      const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
      onAnswer(isCorrect, selectedAnswer);
    }
    // Only trigger when showResult changes to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const getOptionStyle = (option: string) => {
    if (!showResult || selectedAnswer !== option) {
      if (showResult && option.toLowerCase() === correctAnswer.toLowerCase()) {
        return "border-primary bg-primary/10 text-primary";
      }
      return "border-gray-200 bg-white hover:border-accent hover:bg-accent/5";
    }

    if (option.toLowerCase() === correctAnswer.toLowerCase()) {
      return "border-primary bg-primary/10 text-primary";
    }
    return "border-error bg-error/10 text-error";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Audio button for listening exercises */}
      {isListening && (
        <motion.button
          onClick={() => exercise.audio && speak(exercise.audio)}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-4xl transition-colors hover:bg-accent/20"
          whileTap={{ scale: 0.9 }}
        >
          🔊
        </motion.button>
      )}

      {/* Image if available */}
      {exercise.image && !isListening && (
        <motion.div
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white text-7xl shadow-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {exercise.image}
        </motion.div>
      )}

      {/* Question */}
      <div className="text-center">
        <p className="font-heading text-xl font-bold text-text">
          {exercise.question}
        </p>
        {exercise.hint && !showResult && (
          <p className="mt-2 text-sm text-text-light">
            💡 {exercise.hint}
          </p>
        )}
        {/* Feedback after answering */}
        {showResult && selectedAnswer?.toLowerCase() !== correctAnswer.toLowerCase() && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            The answer is: {correctAnswer}
          </motion.p>
        )}
        {showResult && selectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Great job! 🎉
          </motion.p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {exercise.options?.map((option) => (
          <motion.button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={showResult}
            className={`min-h-[60px] rounded-2xl border-2 px-4 py-5 text-center text-lg font-semibold transition-all ${getOptionStyle(option)}`}
            whileHover={!showResult ? { scale: 1.03 } : {}}
            whileTap={!showResult ? { scale: 0.95 } : {}}
          >
            {option}
            {showResult && option.toLowerCase() === correctAnswer.toLowerCase() && (
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
              option.toLowerCase() !== correctAnswer.toLowerCase() && (
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
