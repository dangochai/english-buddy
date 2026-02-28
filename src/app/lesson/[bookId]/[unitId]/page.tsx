"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import WordMatch from "@/components/exercises/WordMatch";
import FillBlank from "@/components/exercises/FillBlank";
import ProgressBar from "@/components/ui/ProgressBar";
import HeartDisplay from "@/components/ui/HeartDisplay";
import XPPopup from "@/components/ui/XPPopup";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const unitId = parseInt(params.unitId as string, 10);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [lastXP, setLastXP] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exercises/${bookId}/${unitId}`)
      .then((res) => res.json())
      .then((data: Exercise[]) => {
        setExercises(data);
        setLoading(false);
      });
  }, [bookId, unitId]);

  const handleAnswer = useCallback(
    (correct: boolean, answer: string) => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      if (correct) {
        setCorrectCount((c) => c + 1);
        setXpEarned((xp) => xp + exercise.points);
        setLastXP(exercise.points);
        setShowXP(true);
        setTimeout(() => setShowXP(false), 800);
      } else {
        setHearts((h) => Math.max(0, h - 1));
      }

      // Record attempt
      fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          exerciseId: exercise.id,
          skill: exercise.skill,
          correct,
          answerGiven: answer,
          xpEarned: correct ? exercise.points : 0,
        }),
      });

      // Next exercise or complete
      setTimeout(() => {
        if (currentIndex + 1 >= exercises.length || hearts <= 0) {
          setIsComplete(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 300);
    },
    [currentIndex, exercises, hearts]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-2xl font-bold text-primary">Loading lesson...</div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📝</div>
        <p className="text-xl font-bold text-text">No exercises yet!</p>
        <p className="text-text-light">
          Content for Unit {unitId} is coming soon.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (isComplete) {
    const accuracy =
      exercises.length > 0
        ? Math.round((correctCount / exercises.length) * 100)
        : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-7xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: 2, duration: 0.5 }}
        >
          🎉
        </motion.div>
        <h1 className="font-heading text-3xl font-bold text-primary">
          Lesson Complete!
        </h1>

        <div className="flex gap-2 text-4xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.2 }}
            >
              {i < stars ? "⭐" : "☆"}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-secondary">{xpEarned}</p>
            <p className="text-sm text-text-light">XP Earned</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-accent">{accuracy}%</p>
            <p className="text-sm text-text-light">Accuracy</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-4 w-full rounded-2xl bg-primary py-4 text-xl font-bold text-white"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  const currentExercise = exercises[currentIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: progress + hearts */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="text-2xl text-text-light"
        >
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar current={currentIndex} total={exercises.length} />
        </div>
        <HeartDisplay hearts={hearts} />
      </div>

      {/* XP display */}
      <div className="flex justify-between text-sm font-semibold text-text-light">
        <span>
          Question {currentIndex + 1} / {exercises.length}
        </span>
        <span className="text-secondary">⚡ {xpEarned} XP</span>
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <ExerciseRenderer exercise={currentExercise} onAnswer={handleAnswer} />
        </motion.div>
      </AnimatePresence>

      {/* XP Popup */}
      <XPPopup xp={lastXP} show={showXP} />
    </div>
  );
}

function ExerciseRenderer({
  exercise,
  onAnswer,
}: {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
}) {
  switch (exercise.type) {
    case "word-match":
    case "listen-pick":
    case "pick-correct":
      return <WordMatch exercise={exercise} onAnswer={onAnswer} />;
    case "fill-blank":
      return <FillBlank exercise={exercise} onAnswer={onAnswer} />;
    default:
      return <WordMatch exercise={exercise} onAnswer={onAnswer} />;
  }
}
