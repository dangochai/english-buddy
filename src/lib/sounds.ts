"use client";

// Simple sound effects using Web Audio API (no external files needed)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available, silently fail
  }
}

export function playCorrectSound() {
  // Happy ascending tone
  playTone(523, 0.15, "sine", 0.25); // C5
  setTimeout(() => playTone(659, 0.15, "sine", 0.25), 100); // E5
  setTimeout(() => playTone(784, 0.25, "sine", 0.25), 200); // G5
}

export function playWrongSound() {
  // Low descending buzz
  playTone(300, 0.2, "triangle", 0.2);
  setTimeout(() => playTone(250, 0.3, "triangle", 0.2), 150);
}

export function playLevelUpSound() {
  // Celebration arpeggio
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.2), i * 120);
  });
}
