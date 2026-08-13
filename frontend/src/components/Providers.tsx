"use client";
// src/components/Providers.tsx
/**
 * Providers — CLIENT COMPONENT
 * Wraps the app in all necessary context providers.
 * This is the single "use client" boundary at the top of the tree.
 */
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"      // toggles class="dark" on <html>
      defaultTheme="system"  // follow the OS preference until the user picks
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
