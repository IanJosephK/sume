import { create } from "zustand";
import type { Medication, MedStatus, TimeOfDay, IconName, SwatchColor } from "../lib/types";
import { db } from "../lib/db";
import type { StoredMed } from "../lib/db";
import { SEED_MEDS } from "../lib/constants";
import { nowHHMM } from "../lib/helpers";
import { sendNotification } from "../lib/notifications";

interface MedState {
  meds: Medication[];
  loaded: boolean;
  loadMeds: () => Promise<void>;
  addMed: (data: {
    name: string;
    dose: string;
    times: TimeOfDay[];
    note: string;
    icon: IconName;
    color: SwatchColor;
    timer: { minutes: number; message: string } | null;
  }) => Promise<void>;
  updateMed: (id: string, data: {
    name: string;
    dose: string;
    times: TimeOfDay[];
    note: string;
    icon: IconName;
    color: SwatchColor;
    timer: { minutes: number; message: string } | null;
  }) => Promise<void>;
  deleteMed: (id: string) => Promise<void>;
  logMed: (id: string) => void;
  undoMed: (id: string) => void;
  tickTimers: () => void;
}

function storedToRuntime(s: StoredMed): Medication {
  return {
    id: s.id,
    name: s.name,
    dose: s.dose,
    times: s.times as TimeOfDay[],
    note: s.note,
    icon: s.icon as IconName,
    color: s.color as SwatchColor,
    timer: s.timerMinutes != null ? { minutes: s.timerMinutes, message: s.timerMessage ?? "Done", remaining: s.timerMinutes * 60 } : null,
    status: "pending",
  };
}

function runtimeToStored(m: Medication): StoredMed {
  return {
    id: m.id,
    name: m.name,
    dose: m.dose,
    times: m.times,
    note: m.note,
    icon: m.icon,
    color: m.color,
    timerMinutes: m.timer?.minutes ?? null,
    timerMessage: m.timer?.message ?? null,
    createdAt: Date.now(),
  };
}

export const useMedStore = create<MedState>()((set, get) => ({
  meds: [],
  loaded: false,

  loadMeds: async () => {
    const stored = await db.meds.toArray();
    if (stored.length === 0) {
      // First launch: seed the DB
      const seeds = SEED_MEDS.map(runtimeToStored);
      await db.meds.bulkPut(seeds);
      set({ meds: SEED_MEDS, loaded: true });
    } else {
      set({ meds: stored.map(storedToRuntime), loaded: true });
    }
  },

  addMed: async (data) => {
    const med: Medication = {
      id: "med_" + Date.now(),
      status: "pending",
      ...data,
      timer: data.timer ? { ...data.timer, remaining: data.timer.minutes * 60 } : null,
    };
    await db.meds.put(runtimeToStored(med));
    set((s) => ({ meds: [...s.meds, med] }));
  },

  updateMed: async (id, data) => {
    const existing = get().meds.find((m) => m.id === id);
    if (!existing) return;
    const updated: Medication = {
      ...existing,
      ...data,
      status: "pending",
      takenAt: undefined,
      timer: data.timer ? { ...data.timer, remaining: data.timer.minutes * 60 } : null,
    };
    await db.meds.put(runtimeToStored(updated));
    set((s) => ({ meds: s.meds.map((m) => (m.id === id ? updated : m)) }));
  },

  deleteMed: async (id) => {
    await db.meds.delete(id);
    set((s) => ({ meds: s.meds.filter((m) => m.id !== id) }));
  },

  logMed: (id) => {
    set((s) => ({
      meds: s.meds.map((m) => {
        if (m.id !== id) return m;
        const at = nowHHMM();
        if (m.timer) {
          return { ...m, status: "timing" as MedStatus, takenAt: at, timer: { ...m.timer, remaining: m.timer.minutes * 60 } };
        }
        return { ...m, status: "taken" as MedStatus, takenAt: at };
      }),
    }));
  },

  undoMed: (id) => {
    set((s) => ({
      meds: s.meds.map((m) =>
        m.id === id
          ? { ...m, status: "pending" as MedStatus, takenAt: undefined, timer: m.timer ? { ...m.timer, remaining: m.timer.minutes * 60 } : null }
          : m
      ),
    }));
  },

  tickTimers: () => {
    set((s) => ({
      meds: s.meds.map((m) => {
        if (m.status !== "timing" || !m.timer) return m;
        const r = m.timer.remaining - 1;
        if (r <= 0) {
          sendNotification("Sume", m.timer.message);
          return { ...m, status: "done" as MedStatus, timer: { ...m.timer, remaining: 0 } };
        }
        return { ...m, timer: { ...m.timer, remaining: r } };
      }),
    }));
  },
}));
