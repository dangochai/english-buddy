"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/exercise";
import { useSpeech } from "@/hooks/useSpeech";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { wordDiff, normalizeText, type WordDiff } from "@/lib/fuzzyMatch";

interface SpeakRepeatProps {
  exercise: Exercise;
  onAnswer: (correct: boolean, answer: string) => void;
  initialAnswer?: string;
}

// Web Speech Recognition type (not in standard TS lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: Event) => void) | null;
    onend: (() => void) | null;
  }
}

/** Word-by-word colour diff showing which words were correct/wrong */
function WordDiffDisplay({
  diffs,
  isCorrect,
}: {
  diffs: WordDiff[];
  isCorrect: boolean;
}) {
  return (
    <div className="w-full rounded-2xl border-2 bg-white px-4 py-4 shadow-sm">
      {/* Heard row */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-light">
        You said
      </p>
      <div className="flex flex-wrap gap-2">
        {diffs.map((d, i) => (
          <span
            key={i}
            className={`rounded-lg px-2 py-0.5 text-base font-semibold ${
              d.correct
                ? "bg-primary/10 text-primary"
                : "bg-error/10 text-error"
            }`}
          >
            {d.heard || <span className="italic opacity-50">—</span>}
            <span className="ml-1 text-xs">{d.correct ? "✅" : "❌"}</span>
          </span>
        ))}
      </div>

      {/* Expected row — only show when something was wrong */}
      {!isCorrect && (
        <>
          <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-text-light">
            Expected
          </p>
          <div className="flex flex-wrap gap-2">
            {diffs.map((d, i) => (
              <span
                key={i}
                className={`rounded-lg px-2 py-0.5 text-base font-semibold ${
                  d.correct ? "text-text-light opacity-40" : "text-accent font-bold"
                }`}
              >
                {d.word}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SpeakRepeat({ exercise, onAnswer, initialAnswer }: SpeakRepeatProps) {
  const { speak } = useSpeech();
  const [mode, setMode] = useState<"idle" | "listening" | "done">(
    initialAnswer ? "done" : "idle"
  );
  const [spokenText, setSpokenText] = useState(initialAnswer ?? "");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasMic, setHasMic] = useState(true);
  const [typingFallback, setTypingFallback] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<WordDiff[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const correctAnswer = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  // Check initial answer correctness
  useEffect(() => {
    if (initialAnswer) {
      const correct = normalizeText(initialAnswer) === normalizeText(correctAnswer);
      setIsCorrect(correct);
      setDiffs(wordDiff(initialAnswer, correctAnswer));
    }
  }, [initialAnswer, correctAnswer]);

  // Check browser support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setHasMic(false);
  }, []);

  // Notify parent
  useEffect(() => {
    if (mode === "done" && spokenText) {
      const correct = normalizeText(spokenText) === normalizeText(correctAnswer);
      onAnswer(correct, spokenText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleListen = () => {
    setMicError(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setTypingFallback(true);
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setSpokenText(transcript);
      const correct = normalizeText(transcript) === normalizeText(correctAnswer);
      setIsCorrect(correct);
      setDiffs(wordDiff(transcript, correctAnswer));
      setMode("done");
      if (correct) playCorrectSound();
      else playWrongSound();
    };

    recognition.onerror = (e: Event & { error?: string }) => {
      setMode("idle");
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("Microphone access denied. Please allow mic access and try again.");
      } else if (e.error === "no-speech") {
        setMicError("No speech detected. Tap the mic and speak clearly.");
      } else {
        // True fallback for audio-capture / network / unknown errors
        setTypingFallback(true);
      }
    };

    recognition.onend = () => {
      if (mode === "listening") setMode("idle");
    };

    recognition.start();
    setMode("listening");
  };

  const handleStopListening = () => {
    recognitionRef.current?.stop();
    setMode("idle");
  };

  const handleTypingSubmit = () => {
    if (!typedValue.trim()) return;
    const correct = normalizeText(typedValue) === normalizeText(correctAnswer);
    setSpokenText(typedValue);
    setIsCorrect(correct);
    setDiffs(wordDiff(typedValue, correctAnswer));
    setMode("done");
    if (correct) playCorrectSound();
    else playWrongSound();
  };

  return (
    <div className="flex flex-col gap-5 items-center">
      {/* Word/sentence to say */}
      <div
        className="w-full rounded-2xl bg-white p-6 text-center shadow-sm cursor-pointer"
        onClick={() => speak(exercise.audio ?? correctAnswer)}
      >
        <p className="font-heading text-2xl font-bold text-text">{correctAnswer}</p>
        <p className="mt-1 text-sm text-text-light">Tap to hear it 🔊</p>
      </div>

      <p className="font-heading text-lg font-bold text-text">{exercise.question}</p>

      {/* Mic / result area */}
      {mode === "done" ? (
        <motion.div
          className="flex w-full flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Word-level diff */}
          <WordDiffDisplay diffs={diffs} isCorrect={!!isCorrect} />

          {isCorrect ? (
            <p className="text-base font-semibold text-primary">Great pronunciation! 🎉</p>
          ) : (
            <p className="text-sm text-text-light">
              Tap the sentence above to hear it again, then try once more 🎤
            </p>
          )}
        </motion.div>
      ) : typingFallback ? (
        <div className="flex w-full gap-3">
          <input
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTypingSubmit()}
            placeholder="Type what you hear…"
            className="flex-1 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-lg font-semibold text-text outline-none focus:border-accent"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <button
            onClick={handleTypingSubmit}
            disabled={!typedValue.trim()}
            className="rounded-2xl bg-primary px-5 py-3 font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            Check
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={mode === "idle" ? handleListen : handleStopListening}
            className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg transition-all ${
              mode === "listening"
                ? "bg-error/20 ring-4 ring-error/40"
                : "bg-accent/10 hover:bg-accent/20"
            }`}
            animate={mode === "listening" ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            whileTap={{ scale: 0.9 }}
          >
            {mode === "listening" ? "⏹️" : "🎤"}
          </motion.button>
          <p className="text-sm text-text-light">
            {mode === "listening" ? "Listening… tap to stop" : "Tap the mic and speak"}
          </p>

          {/* Mic error message */}
          {micError && (
            <motion.p
              className="text-center text-sm font-semibold text-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {micError}
            </motion.p>
          )}

          <button
            onClick={() => setTypingFallback(true)}
            className="text-xs text-text-light underline"
          >
            {hasMic ? "Can't use mic? Type instead" : "Type your answer instead"}
          </button>
        </div>
      )}
    </div>
  );
}
