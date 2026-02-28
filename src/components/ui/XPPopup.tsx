"use client";

import { motion, AnimatePresence } from "framer-motion";

interface XPPopupProps {
  xp: number;
  show: boolean;
}

export default function XPPopup({ xp, show }: XPPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed top-1/3 left-1/2 z-50 -translate-x-1/2 text-4xl font-bold text-secondary"
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -60, scale: 1.2 }}
          exit={{ opacity: 0, y: -120 }}
          transition={{ duration: 0.8 }}
        >
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
