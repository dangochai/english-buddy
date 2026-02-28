"use client";

import { useEffect } from "react";
import { unlockAudio } from "@/lib/sounds";

/**
 * Invisible component that unlocks Web Audio API on first user interaction.
 * Required on iOS Safari where AudioContext starts in "suspended" state.
 * Place once in the root layout.
 */
export default function AudioUnlocker() {
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      // Remove listeners after first interaction — only need to unlock once
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };

    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("click", unlock);

    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, []);

  return null;
}
