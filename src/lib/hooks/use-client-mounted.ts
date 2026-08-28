"use client";

import { useEffect, useState } from "react";

/** Avoid SSR/client markup mismatch for browser-only UI (localStorage, dates). */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
