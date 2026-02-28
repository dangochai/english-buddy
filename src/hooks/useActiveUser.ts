"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "activeUserId";

export function useActiveUser() {
  // null = not yet read from localStorage (avoids SSR hydration mismatch)
  const [userId, setUserIdState] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUserIdState(stored ? parseInt(stored, 10) : 1);
  }, []);

  const setActiveUserId = (id: number) => {
    localStorage.setItem(STORAGE_KEY, String(id));
    setUserIdState(id);
  };

  return { userId, setActiveUserId };
}
