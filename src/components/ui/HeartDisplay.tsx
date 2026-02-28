"use client";

import { motion } from "framer-motion";

interface HeartDisplayProps {
  hearts: number;
  maxHearts?: number;
}

export default function HeartDisplay({
  hearts,
  maxHearts = 5,
}: HeartDisplayProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <motion.span
          key={i}
          className="text-2xl"
          animate={i < hearts ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {i < hearts ? "❤️" : "🤍"}
        </motion.span>
      ))}
    </div>
  );
}
