export type MedStatus = "pending" | "taken" | "timing" | "done";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type SwatchColor = "coral" | "sand" | "sage" | "blue" | "amber" | "mauve" | "olive" | "blush";

export type IconName =
  | "pill" | "capsule" | "droplet" | "sun" | "shield"
  | "heart" | "eye" | "leaf" | "flask" | "syringe";

export interface MedTimer {
  minutes: number;
  message: string;
  remaining: number;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  times: TimeOfDay[];
  note: string;
  icon: IconName;
  color: SwatchColor;
  timer: MedTimer | null;
  status: MedStatus;
  takenAt?: string;
}

export interface HistoryEntry {
  icon: IconName;
  color: SwatchColor;
  name: string;
  dose: string;
  at: string; // "HH:MM" or "missed"
}

export interface HistoryDay {
  id: string;
  label: string;
  sub: string;
  summary: string;
  entries: HistoryEntry[];
}

export interface WeekDay {
  d: string;
  date: string;
  status: "complete" | "partial" | "missed" | "today";
}

export type ThemeMode = "light" | "dark";
export type AccentKey = "coral" | "indigo" | "lime" | "pink";

export interface AccentDef {
  c: string;
  ink: string;
  h: number;
}
