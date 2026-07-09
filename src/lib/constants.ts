import type { TimeOfDay, SwatchColor, IconName, AccentKey, AccentDef } from "./types";

export const SWATCH_ORDER: SwatchColor[] = ["coral","sand","sage","blue","amber","mauve","olive","blush"];
export const ICON_ORDER: IconName[] = ["pill","capsule","droplet","sun","shield","heart","eye","leaf","flask","syringe"];

export const TIMES: { key: TimeOfDay; label: string }[] = [
  { key: "morning",   label: "Morning"   },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening",   label: "Evening"   },
  { key: "night",     label: "Night"     },
];

export const ACCENTS: Record<AccentKey, AccentDef> = {
  coral:  { c: "#ff6a47", ink: "#ffffff", h: 35  },
  indigo: { c: "#5d6cff", ink: "#ffffff", h: 268 },
  lime:   { c: "#6fcb3c", ink: "#0d1f06", h: 137 },
  pink:   { c: "#ff4f8f", ink: "#ffffff", h: 5   },
};
