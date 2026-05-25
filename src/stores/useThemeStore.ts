import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode, AccentKey } from "../lib/types";
import { ACCENTS } from "../lib/constants";

interface ThemeState {
  theme: ThemeMode;
  accent: AccentKey;
  toggleTheme: () => void;
  setAccent: (a: AccentKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      accent: "coral",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setAccent: (accent) => set({ accent }),
    }),
    { name: "sume-theme" }
  )
);

// Apply theme + accent CSS vars to documentElement
export function applyTheme(theme: ThemeMode, accent: AccentKey): void {
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
  const a = ACCENTS[accent];
  el.style.setProperty("--accent", a.c);
  el.style.setProperty("--accentInk", a.ink);
  el.style.setProperty("--accent-h", String(a.h));
}
