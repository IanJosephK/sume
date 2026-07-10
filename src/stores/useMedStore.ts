import { create } from "zustand";
import type { Medication, MedStatus, TimeOfDay, IconName, SwatchColor } from "../lib/types";
import { db } from "../lib/db";
import type { StoredMed } from "../lib/db";

import { nowHHMM, todayISO } from "../lib/helpers";
import { sendNotification } from "../lib/notifications";
import { syncReminders } from "../lib/pushSync";

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
    reminder: string | null;
  }) => Promise<void>;
  updateMed: (id: string, data: {
    name: string;
    dose: string;
    times: TimeOfDay[];
    note: string;
    icon: IconName;
    color: SwatchColor;
    timer: { minutes: number; message: string } | null;
    reminder: string | null;
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
    reminder: s.reminder ?? null,
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
    reminder: m.reminder,
    createdAt: Date.now(),
  };
}

function pushSync(meds: Medication[]) {
  const reminders = meds
    .filter((m) => m.reminder)
    .map((m) => ({ time: m.reminder!, medName: m.name }));
  syncReminders(reminders);
}

export const useMedStore = create<MedState>()((set, get) => ({
  meds: [],
  loaded: false,

  loadMeds: async () => {
    const stored = await db.meds.toArray();
    const today = todayISO();
    const todayLogs = await db.logs.where("date").equals(today).toArray();
    const loggedSet = new Set(todayLogs.map((l) => l.medId));
    const meds = stored.map((s) => {
      const m = storedToRuntime(s);
      if (loggedSet.has(m.id)) {
        const log = todayLogs.find((l) => l.medId === m.id);
        if (m.timer && log?.loggedTimestamp) {
          const elapsed = Math.floor((Date.now() - log.loggedTimestamp) / 1000);
          const total = m.timer.minutes * 60;
          if (elapsed < total) {
            return { ...m, status: "timing" as MedStatus, takenAt: log?.takenAt ?? undefined, timer: { ...m.timer, remaining: total - elapsed } };
          }
          return { ...m, status: "done" as MedStatus, takenAt: log?.takenAt ?? undefined, timer: { ...m.timer, remaining: 0 } };
        }
        return { ...m, status: "taken" as MedStatus, takenAt: log?.takenAt ?? undefined };
      }
      return m;
    });
    set({ meds, loaded: true });
    pushSync(meds);
  },

  addMed: async (data) => {
    const med: Medication = {
      id: "med_" + Date.now(),
      status: "pending",
      ...data,
      timer: data.timer ? { ...data.timer, remaining: data.timer.minutes * 60 } : null,
      reminder: data.reminder,
    };
    await db.meds.put(runtimeToStored(med));
    const next = [...get().meds, med];
    set({ meds: next });
    pushSync(next);
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
    const next = get().meds.map((m) => (m.id === id ? updated : m));
    set({ meds: next });
    pushSync(next);
  },

  deleteMed: async (id) => {
    await db.meds.delete(id);
    const next = get().meds.filter((m) => m.id !== id);
    set({ meds: next });
    pushSync(next);
  },

  logMed: (id) => {
    const at = nowHHMM();
    const date = todayISO();
    set((s) => ({
      meds: s.meds.map((m) => {
        if (m.id !== id) return m;
        if (m.timer) {
          return { ...m, status: "timing" as MedStatus, takenAt: at, timer: { ...m.timer, remaining: m.timer.minutes * 60 } };
        }
        return { ...m, status: "taken" as MedStatus, takenAt: at };
      }),
    }));
    db.logs.where({ medId: id, date }).first().then((existing) => {
      if (!existing) {
        db.logs.add({ medId: id, date, takenAt: at, loggedTimestamp: Date.now() });
      }
    });
  },

  undoMed: (id) => {
    set((s) => ({
      meds: s.meds.map((m) =>
        m.id === id
          ? { ...m, status: "pending" as MedStatus, takenAt: undefined, timer: m.timer ? { ...m.timer, remaining: m.timer.minutes * 60 } : null }
          : m
      ),
    }));
    const date = todayISO();
    db.logs.where({ medId: id, date }).delete();
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
