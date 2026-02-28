"use client";

// Simple sound effects using Web Audio API (no external files needed)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Unlock AudioContext on iOS Safari.
 * iOS suspends AudioContext until a user gesture — call this on first tap/click.
 */
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // Not available, silently skip
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = getAudioContext();
    // Resume if suspended (e.g. iOS Safari after page load)
    if (ctx.state === "suspended") {
      ctx.resume().then(() => _playTone(ctx, frequency, duration, type, volume));
      return;
    }
    _playTone(ctx, frequency, duration, type, volume);
  } catch {
    // Audio not available, silently fail
  }
}

function _playTone(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType, volume: number) {
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
