import Dexie, { type EntityTable } from "dexie";

// Stored medication (persistent definition, no runtime status)
export interface StoredMed {
  id: string;
  name: string;
  dose: string;
  times: string[];
  note: string;
  icon: string;
  color: string;
  timerMinutes: number | null;
  timerMessage: string | null;
  createdAt: number;
}

// Daily log entry
export interface DailyLog {
  id?: number;
  medId: string;
  date: string; // YYYY-MM-DD
  takenAt: string | null; // HH:MM or null if missed
  loggedTimestamp: number;
}

const db = new Dexie("SumeDB") as Dexie & {
  meds: EntityTable<StoredMed, "id">;
  logs: EntityTable<DailyLog, "id">;
};

db.version(1).stores({
  meds: "id, name, createdAt",
  logs: "++id, medId, date, [medId+date]",
});

export { db };
