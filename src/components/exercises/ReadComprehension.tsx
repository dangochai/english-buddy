"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { useSpeech } from "@/hooks/useSpeech";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

interface ReadComprehensionProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

export default function ReadComprehension({ exercise, onAnswer, initialAnswer }: ReadComprehensionProps) {
  const { speak } = useSpeech();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer ?? null);
  const [showResult, setShowResult] = useState(!!initialAnswer);

  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  // Notify parent
  useEffect(() => {
    if (showResult && selectedAnswer !== null) {
      const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
      onAnswer(isCorrect, selectedAnswer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    const isCorrect = option.toLowerCase() === correctAnswer.toLowerCase();
    if (isCorrect) playCorrectSound();
    else playWrongSound();
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) return "border-gray-200 bg-white hover:border-accent hover:bg-accent/5";
    if (option.toLowerCase() === correctAnswer.toLowerCase()) return "border-primary bg-primary/10 text-primary";
    if (selectedAnswer === option) return "border-error bg-error/10 text-error";
    return "border-gray-200 bg-white opacity-60";
  };

  // Split passage into words for tap-to-hear
  const passage = exercise.passage ?? exercise.question;
  const words = passage.split(" ");

  return (
    <div className="flex flex-col gap-5">
      {/* Passage */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-light">
          📖 Read this
        </p>
        <p className="text-lg leading-relaxed text-text">
          {words.map((word, idx) => (
            <span key={idx}>
              <span
                className="cursor-pointer rounded px-0.5 transition-colors hover:bg-accent/10 hover:text-accent"
                onClick={() => speak(word.replace(/[.,!?]/g, ""))}
              >
                {word}
              </span>
              {idx < words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <p className="mt-2 text-xs text-text-light">Tap any word to hear it 🔊</p>
      </div>

      {/* Question */}
      <div className="text-center">
        <p className="font-heading text-xl font-bold text-text">{exercise.passage ? exercise.question : "Answer the question:"}</p>
        {exercise.hint && !showResult && (
          <p className="mt-1 text-sm text-text-light">💡 {exercise.hint}</p>
        )}
        {showResult && selectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Well done! 🎉
          </motion.p>
        )}
        {showResult && selectedAnswer?.toLowerCase() !== correctAnswer.toLowerCase() && (
          <motion.p
            className="mt-2 text-base font-semibold text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            The answer is: {correctAnswer}
          </motion.p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {exercise.options?.map((option) => (
          <motion.button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={showResult}
            className={`min-h-[56px] w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition-all ${getOptionStyle(option)}`}
            whileHover={!showResult ? { scale: 1.01 } : {}}
            whileTap={!showResult ? { scale: 0.98 } : {}}
          >
            {option}
            {showResult && option.toLowerCase() === correctAnswer.toLowerCase() && (
              <span className="ml-2">✅</span>
            )}
            {showResult && selectedAnswer === option && option.toLowerCase() !== correctAnswer.toLowerCase() && (
              <span className="ml-2">❌</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
