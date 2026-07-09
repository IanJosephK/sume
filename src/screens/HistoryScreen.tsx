import { useState, useEffect } from "react";
import { Icons } from "../components/Icons";
import { useThemeStore } from "../stores/useThemeStore";
import { db } from "../lib/db";
import type { StoredMed, DailyLog } from "../lib/db";
import { todayISO, daysAgoISO, shortDay, dayOfMonth, dayLabel, daySub } from "../lib/helpers";
import type { WeekDay, HistoryDay, HistoryEntry, IconName, SwatchColor } from "../lib/types";

interface HistoryScreenProps {
  onGoToday: () => void;
}

function buildWeekStrip(
  logs: DailyLog[],
  meds: StoredMed[],
  today: string,
  dates: string[],
): WeekDay[] {
  const medsByDate = new Map<string, Set<string>>();

  // Build a map of which meds existed on each date (by createdAt)
  for (const date of dates) {
    const dateTs = new Date(date + "T23:59:59").getTime();
    const activeMeds = meds.filter((m) => m.createdAt <= dateTs);
    medsByDate.set(date, new Set(activeMeds.map((m) => m.id)));
  }

  // Build a map of which meds were logged on each date
  const logsByDate = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
    logsByDate.get(log.date)!.add(log.medId);
  }

  return dates.map((date) => {
    const isToday = date === today;
    const totalMeds = medsByDate.get(date)?.size ?? 0;
    const loggedMeds = logsByDate.get(date)?.size ?? 0;

    let status: WeekDay["status"];
    if (isToday) {
      status = "today";
    } else if (totalMeds === 0) {
      status = "missed";
    } else if (loggedMeds >= totalMeds) {
      status = "complete";
    } else if (loggedMeds > 0) {
      status = "partial";
    } else {
      status = "missed";
    }

    return { d: shortDay(date), date: dayOfMonth(date), status };
  });
}

function buildHistoryDays(
  logs: DailyLog[],
  meds: StoredMed[],
  today: string,
  dates: string[],
): HistoryDay[] {
  // Exclude today from history list (today is shown on the Today screen)
  const pastDates = dates.filter((d) => d !== today);

  const logsByDate = new Map<string, DailyLog[]>();
  for (const log of logs) {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date)!.push(log);
  }

  const medsById = new Map(meds.map((m) => [m.id, m]));

  return pastDates.map((date) => {
    const dateTs = new Date(date + "T23:59:59").getTime();
    const activeMeds = meds.filter((m) => m.createdAt <= dateTs);
    const dayLogs = logsByDate.get(date) ?? [];

    const entries: HistoryEntry[] = activeMeds.map((med) => {
      const log = dayLogs.find((l) => l.medId === med.id);
      return {
        icon: med.icon as IconName,
        color: med.color as SwatchColor,
        name: med.name,
        dose: med.dose,
        at: log?.takenAt ?? "missed",
      };
    });

    // Also include logs for meds that were since deleted
    for (const log of dayLogs) {
      if (!medsById.has(log.medId) && !activeMeds.some((m) => m.id === log.medId)) {
        entries.push({
          icon: "pill" as IconName,
          color: "sand" as SwatchColor,
          name: "(deleted)",
          dose: "",
          at: log.takenAt ?? "missed",
        });
      }
    }

    const taken = entries.filter((e) => e.at !== "missed").length;
    const total = entries.length;

    return {
      id: date,
      label: dayLabel(date, today),
      sub: daySub(date),
      summary: total === 0 ? "No meds" : `${taken} of ${total} taken`,
      entries,
    };
  });
}

export function HistoryScreen({ onGoToday }: HistoryScreenProps) {
  const { theme, toggleTheme } = useThemeStore();
  const [weekStrip, setWeekStrip] = useState<WeekDay[]>([]);
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = todayISO();
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) dates.push(daysAgoISO(i));

      const [allLogs, allMeds] = await Promise.all([
        db.logs.where("date").anyOf(dates).toArray(),
        db.meds.toArray(),
      ]);

      if (cancelled) return;

      setWeekStrip(buildWeekStrip(allLogs, allMeds, today, dates));
      setHistoryDays(buildHistoryDays(allLogs, allMeds, today, dates));
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="screen">
      <header className="hdr">
        <div className="hdr__left">
          <div className="hdr__date">History</div>
          <div className="hdr__big">Last 7 days</div>
        </div>
        <div className="hdr__right">
          <div className="hdr__toggle">
            <button className="tg" onClick={toggleTheme}>
              {theme === "dark" ? <Icons.sun w={16} sw={1.7} /> : <Icons.moon w={16} sw={1.7} />}
            </button>
            <button className="tg" onClick={onGoToday}><Icons.home w={15} sw={1.7} /></button>
            <button className="tg tg--on"><Icons.list w={15} sw={1.7} /></button>
          </div>
        </div>
      </header>

      <div className="weekWrap">
        <div className="week">
          {weekStrip.map((d, i) => (
            <div className={"week__col " + (d.status === "today" ? "week__col--today" : "")} key={i}>
              <div className="week__d">{d.d}</div>
              <div className={"week__dot week__dot--" + d.status}>{d.date}</div>
            </div>
          ))}
        </div>
        <div className="weekLegend">
          <span className="lg"><span className="lgDot lgDot--complete" />complete</span>
          <span className="lg"><span className="lgDot lgDot--partial" />partial</span>
          <span className="lg"><span className="lgDot lgDot--missed" />missed</span>
        </div>
      </div>

      {historyDays.length === 0 ? (
        <div className="empty">
          <div className="empty__title">No history yet</div>
          <div className="empty__sub">Log your medications to see them here.</div>
        </div>
      ) : (
        <div className="histList">
          {historyDays.map((day) => (
            <section className="histDay" key={day.id}>
              <header className="histDay__h">
                <div className="histDay__title">
                  <span className="histDay__lbl">{day.label}</span>
                  <span className="histDay__sub">{day.sub}</span>
                </div>
                <div className="histDay__sum">{day.summary}</div>
              </header>
              {day.entries.length > 0 && (
                <div className="histDay__items">
                  {day.entries.map((e, i) => {
                    const Icon = Icons[e.icon];
                    const missed = e.at === "missed";
                    return (
                      <div className={"histRow " + (missed ? "histRow--missed" : "")} key={i}>
                        <div className={`histRow__icon ${missed ? "sw-missed" : "sw-" + e.color}`}><Icon w={16} sw={1.7} /></div>
                        <div className="histRow__name">
                          <span>{e.name}</span>
                          <span className="histRow__dose">{e.dose}</span>
                        </div>
                        <div className={"histRow__at " + (missed ? "histRow__at--miss" : "")}>
                          {missed ? "missed" : e.at}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
