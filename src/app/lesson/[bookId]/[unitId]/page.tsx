"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import WordMatch from "@/components/exercises/WordMatch";
import FillBlank from "@/components/exercises/FillBlank";
import TypeWord from "@/components/exercises/TypeWord";
import SentenceOrder from "@/components/exercises/SentenceOrder";
import WordScramble from "@/components/exercises/WordScramble";
import SpeakRepeat from "@/components/exercises/SpeakRepeat";
import ReadComprehension from "@/components/exercises/ReadComprehension";
import ProgressBar from "@/components/ui/ProgressBar";
import HeartDisplay from "@/components/ui/HeartDisplay";
import XPPopup from "@/components/ui/XPPopup";
import ConfettiAnimation from "@/components/ui/ConfettiAnimation";
import { playCorrectSound, playWrongSound, playLevelUpSound } from "@/lib/sounds";
import { useActiveUser } from "@/hooks/useActiveUser";

interface AnswerRecord {
  exercise: Exercise;
  correct: boolean;
  answerGiven: string;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const unitId = parseInt(params.unitId as string, 10);
  const { userId } = useActiveUser();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [lastXP, setLastXP] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    fetch(`/api/exercises/${bookId}/${unitId}`)
      .then((res) => res.json())
      .then((data: Exercise[]) => {
        setExercises(data);
        setLoading(false);
      });
  }, [bookId, unitId]);

  // Save progress when lesson completes
  useEffect(() => {
    if (!isComplete || progressSaved || exercises.length === 0) return;

    const accuracy = Math.round((correctCount / exercises.length) * 100);
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId ?? 1,
        book: bookId,
        unit: unitId,
        stars,
        accuracy,
        exercisesDone: exercises.length,
        xpEarned,
      }),
    }).then(() => {
      setProgressSaved(true);
      // Play after fetch resolves — still within async chain started by lesson completion,
      // but AudioUnlocker ensures context is already unlocked from earlier user taps.
      playLevelUpSound();
    });
  }, [isComplete, progressSaved, correctCount, exercises.length, bookId, unitId, xpEarned]);

  // Check if current question was already answered (navigating back)
  const currentAnswer = answers.find(
    (a) => a.exercise.id === exercises[currentIndex]?.id
  );
  const isCurrentAnswered = answeredCurrent || !!currentAnswer;

  const handleAnswer = useCallback(
    (correct: boolean, answer: string) => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      // Don't re-record if already answered (navigating back to this question)
      const alreadyAnswered = answers.some((a) => a.exercise.id === exercise.id);
      if (alreadyAnswered) {
        setAnsweredCurrent(true);
        return;
      }

      // Record answer for review
      setAnswers((prev) => [...prev, { exercise, correct, answerGiven: answer }]);
      setAnsweredCurrent(true);

      if (correct) {
        playCorrectSound();
        setCorrectCount((c) => c + 1);
        setXpEarned((xp) => xp + exercise.points);
        setLastXP(exercise.points);
        setShowXP(true);
        setTimeout(() => setShowXP(false), 800);
      } else {
        playWrongSound();
        setHearts((h) => Math.max(0, h - 1));
      }

      // Record attempt to DB
      fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId ?? 1,
          exerciseId: exercise.id,
          skill: exercise.skill,
          correct,
          answerGiven: answer,
          xpEarned: correct ? exercise.points : 0,
        }),
      });
    },
    [currentIndex, exercises, answers]
  );

  const handleNext = () => {
    if (currentIndex + 1 >= exercises.length || hearts <= 0) {
      setIsComplete(true);
    } else {
      setDirection("forward");
      setAnsweredCurrent(false);
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection("back");
      setAnsweredCurrent(false);
      setCurrentIndex((i) => i - 1);
    }
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="text-6xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          📚
        </motion.div>
      </div>
    );
  }

  // --- NO CONTENT ---
  if (exercises.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">🔒</div>
        <p className="font-heading text-xl font-bold text-text">Coming soon!</p>
        <p className="text-center text-text-light">
          Exercises for this unit are being prepared.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 min-h-[56px] rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  // --- ANSWER REVIEW ---
  if (showReview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-text">Answer Review</h2>
          <button
            onClick={() => setShowReview(false)}
            className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-text-light"
          >
            Back
          </button>
        </div>

        <div className="space-y-3">
          {answers.map((record, idx) => {
            const correctAnswer = Array.isArray(record.exercise.correctAnswer)
              ? record.exercise.correctAnswer[0]
              : record.exercise.correctAnswer;

            return (
              <div
                key={idx}
                className={`rounded-xl border-2 p-4 ${
                  record.correct
                    ? "border-primary/30 bg-primary/5"
                    : "border-error/30 bg-error/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="flex-1 font-semibold text-text">
                    {idx + 1}. {record.exercise.question}
                  </p>
                  <span className="ml-2 text-xl">
                    {record.correct ? "✅" : "❌"}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <p>
                    Your answer:{" "}
                    <span className={record.correct ? "font-semibold text-primary" : "font-semibold text-error"}>
                      {record.answerGiven}
                    </span>
                  </p>
                  {!record.correct && (
                    <p className="mt-1">
                      Correct answer:{" "}
                      <span className="font-semibold text-primary">
                        {correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-2 min-h-[56px] w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  // --- LESSON COMPLETE ---
  if (isComplete) {
    const accuracy =
      exercises.length > 0
        ? Math.round((correctCount / exercises.length) * 100)
        : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
      <>
        {progressSaved && <ConfettiAnimation />}
        <motion.div
          className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Mascot + celebration */}
          <motion.div
            className="flex flex-col items-center gap-1"
            animate={{ y: [0, -12, 0, -8, 0] }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="text-6xl">🐻</div>
            <div className="text-5xl">🎉</div>
          </motion.div>

          <h1 className="font-heading text-3xl font-bold text-primary">
            Lesson Complete!
          </h1>

          <div className="flex gap-3 text-5xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                transition={{ delay: 0.4 + i * 0.25, duration: 0.45, ease: "backOut" }}
              >
                {i < stars ? "⭐" : "☆"}
              </motion.span>
            ))}
          </div>

        <div className="grid w-full grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-secondary">{xpEarned}</p>
            <p className="text-xs text-text-light">XP Earned</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-accent">{accuracy}%</p>
            <p className="text-xs text-text-light">Accuracy</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-primary">
              {correctCount}/{exercises.length}
            </p>
            <p className="text-xs text-text-light">Correct</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => setShowReview(true)}
            className="min-h-[56px] w-full rounded-2xl border-2 border-accent bg-white py-4 text-lg font-bold text-accent"
          >
            Review Answers
          </button>
          <button
            onClick={() => router.push("/")}
            className="min-h-[56px] w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white"
          >
            Continue
          </button>
        </div>
      </motion.div>
      </>
    );
  }

  // --- ACTIVE LESSON ---
  const currentExercise = exercises[currentIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="text-5xl">😢</div>
              <h3 className="font-heading mt-3 text-xl font-bold text-text">
                Leave this lesson?
              </h3>
              <p className="mt-2 text-sm text-text-light">
                Your progress in this lesson will be lost.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="min-h-[48px] flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-text"
                >
                  Stay
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="min-h-[48px] flex-1 rounded-xl bg-error py-3 font-semibold text-white"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar: exit + progress + hearts */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-text-light hover:bg-gray-100"
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

      {/* Skill badge */}
      <div className="flex justify-center">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
          {currentExercise.skill}
        </span>
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: direction === "forward" ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === "forward" ? -50 : 50 }}
          transition={{ duration: 0.3 }}
        >
          <ExerciseRenderer
            exercise={currentExercise}
            onAnswer={handleAnswer}
            initialAnswer={currentAnswer?.answerGiven}
          />
        </motion.div>
      </AnimatePresence>

      {/* Back / Next navigation */}
      <div className="flex gap-3">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className={`min-h-[56px] flex-1 rounded-2xl border-2 py-4 text-lg font-bold transition-all ${
            currentIndex === 0
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-accent bg-white text-accent hover:bg-accent/5"
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isCurrentAnswered}
          className={`min-h-[56px] flex-1 rounded-2xl py-4 text-lg font-bold transition-all ${
            isCurrentAnswered
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {currentIndex + 1 >= exercises.length ? "Finish" : "Next"}
        </button>
      </div>

      {/* XP Popup */}
      <XPPopup xp={lastXP} show={showXP} />
    </div>
  );
}

function ExerciseRenderer({
  exercise,
  onAnswer,
  initialAnswer,
}: {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}) {
  switch (exercise.type) {
    case "word-match":
    case "listen-pick":
    case "pick-correct":
      return <WordMatch exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "fill-blank":
      return <FillBlank exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "type-word":
    case "type-sentence":
      return <TypeWord exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "sentence-order":
      return <SentenceOrder exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "word-scramble":
      return <WordScramble exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "repeat-word":
    case "repeat-sentence":
    case "answer-question":
      return <SpeakRepeat exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    case "read-comprehension":
    case "read-true-false":
      return <ReadComprehension exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
    default:
      return <WordMatch exercise={exercise} onAnswer={onAnswer} initialAnswer={initialAnswer} />;
  }
}
