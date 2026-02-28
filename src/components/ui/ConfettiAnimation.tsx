"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#F44336", "#9C27B0", "#FFD700"];
const PARTICLE_COUNT = 30;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // vw percent
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 8 + Math.random() * 10, // 8-18px
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 1.0, // 1.2-2.2s
    rotation: Math.random() * 720 - 360,
  }));
}

export default function ConfettiAnimation({ onDone }: { onDone?: () => void }) {
  const [particles] = useState<Particle[]>(generateParticles);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.x}vw`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
