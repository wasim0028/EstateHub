"use client";
// src/components/ThemeToggle.tsx
/**
 * ThemeToggle — CLIENT COMPONENT
 *
 * Sun/moon button that switches between light and dark. Theme state is
 * handled by next-themes, which persists the choice to localStorage and
 * applies a `dark` class to <html> (matching `darkMode: "class"` in
 * tailwind.config.ts).
 *
 * The `mounted` guard is required: on the server we don't know the user's
 * stored theme, so rendering the resolved icon immediately would cause a
 * hydration mismatch. We render a same-sized placeholder until mount.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    // Placeholder keeps the navbar layout from shifting on hydration
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
