"use client";

import { useCallback, useRef } from "react";

const VOICE_LANG = "en-GB";
const VOICE_RATE = 0.85; // Slightly slow for kids

export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options?: { rate?: number; onEnd?: () => void }) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LANG;
    utterance.rate = options?.rate ?? VOICE_RATE;
    utterance.pitch = 1.1; // Slightly higher pitch for kid-friendly voice

    // Try to find a British English voice
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(
      (v) => v.lang === "en-GB" && v.name.includes("Female")
    ) ?? voices.find((v) => v.lang === "en-GB") ?? voices.find((v) => v.lang.startsWith("en"));

    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
