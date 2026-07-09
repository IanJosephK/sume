import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Icons } from "../components/Icons";
import { MedCard } from "../components/MedCard";
import { useMedStore } from "../stores/useMedStore";
import { useThemeStore } from "../stores/useThemeStore";
import { getHeader, daysAgoISO } from "../lib/helpers";
import { db } from "../lib/db";
import { TIMES } from "../lib/constants";
import type { Medication, TimeOfDay } from "../lib/types";

const SECTION_GLYPH: Record<TimeOfDay, (p: { w?: number; sw?: number }) => React.JSX.Element> = {
  morning: Icons.sun,
  afternoon: Icons.eye,
  evening: Icons.flask,
  night: Icons.leaf,
};

interface TodayScreenProps {
  onOpenAdd: () => void;
  onGoHistory: () => void;
  onEdit: (med: Medication) => void;
}

export function TodayScreen({ onOpenAdd, onGoHistory, onEdit }: TodayScreenProps) {
  const { meds, logMed, undoMed, tickTimers } = useMedStore();
  const { theme, toggleTheme } = useThemeStore();
  const [streak, setStreak] = useState(0);

  const computeStreak = useCallback(async () => {
    const allMeds = await db.meds.toArray();
    if (allMeds.length === 0) { setStreak(0); return; }

    let count = 0;
    // Start from yesterday and go backwards
    for (let i = 1; i <= 365; i++) {
      const date = daysAgoISO(i);
      const dateTs = new Date(date + "T23:59:59").getTime();
      const activeMeds = allMeds.filter((m) => m.createdAt <= dateTs);
      if (activeMeds.length === 0) break; // No meds existed before this date
      const dayLogs = await db.logs.where("date").equals(date).toArray();
      const loggedIds = new Set(dayLogs.map((l) => l.medId));
      const allLogged = activeMeds.every((m) => loggedIds.has(m.id));
      if (allLogged) { count++; } else { break; }
    }
    // Also check if today is complete
    const todayDate = daysAgoISO(0);
    const todayLogs = await db.logs.where("date").equals(todayDate).toArray();
    const todayLoggedIds = new Set(todayLogs.map((l) => l.medId));
    const todayComplete = allMeds.every((m) => todayLoggedIds.has(m.id));
    if (todayComplete) count++;
    setStreak(count);
  }, []);

  useEffect(() => {
    const id = setInterval(tickTimers, 1000);
    return () => clearInterval(id);
  }, [tickTimers]);

  useEffect(() => { computeStreak(); }, [meds, computeStreak]);

  const logged = meds.filter((m) => m.status === "taken" || m.status === "done" || m.status === "timing").length;
  const total = meds.length;
  const complete = logged === total && total > 0;
  const { day, date } = getHeader();

  if (total === 0) {
    return (
      <div className="screen">
        <header className="hdr">
          <div className="hdr__left">
            <div className="hdr__date">{day}</div>
            <div className="hdr__big">{date}</div>
          </div>
          <div className="hdr__right">
            <div className="hdr__toggle">
              <button className="tg" onClick={toggleTheme}>
                {theme === "dark" ? <Icons.sun w={16} sw={1.7} /> : <Icons.moon w={16} sw={1.7} />}
              </button>
              <button className="tg tg--on"><Icons.home w={16} sw={1.7} /></button>
              <button className="tg" onClick={onGoHistory}><Icons.list w={16} sw={1.7} /></button>
            </div>
          </div>
        </header>
        <div className="empty">
          <div className="empty__icon"><Icons.pill w={36} sw={1.4} /></div>
          <div className="empty__title">No medications yet</div>
          <div className="empty__sub">Add your first medication to start tracking.</div>
          <button className="btn btn--primary empty__cta" onClick={onOpenAdd}>
            <Icons.plus w={16} sw={2} /> Add your first medication
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="hdr">
        <div className="hdr__left">
          <div className="hdr__date">{day}</div>
          <div className="hdr__big">{date}</div>
        </div>
        <div className="hdr__right">
          <div className="hdr__toggle">
            <button className="tg" onClick={toggleTheme}>
              {theme === "dark" ? <Icons.sun w={16} sw={1.7} /> : <Icons.moon w={16} sw={1.7} />}
            </button>
            <button className="tg tg--on"><Icons.home w={16} sw={1.7} /></button>
            <button className="tg" onClick={onGoHistory}><Icons.list w={16} sw={1.7} /></button>
          </div>
        </div>
      </header>

      <div className="meta">
        <div className="meta__top">
          <motion.div
            className={"meta__streak" + (complete ? " bright" : "")}
            animate={complete ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="meta__flame"><Icons.flame w={14} sw={1.6} /></span>
            <span className="meta__num">{streak}</span>
            <span className="meta__lbl"> day streak</span>
          </motion.div>
          <div className="meta__progLabel"><b>{logged}</b> of {total} logged</div>
        </div>
        <div className="prog__bar">
          <motion.div
            className="prog__fill"
            animate={{ width: `${total ? (logged / total) * 100 : 0}%` }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <div className="sections">
        {TIMES.map((t) => {
          const list = meds.filter((m) => m.times.includes(t.key));
          if (!list.length) return null;
          const Glyph = SECTION_GLYPH[t.key];
          return (
            <section className="sec" key={t.key}>
              <header className="sec__h">
                <span className="sec__glyph"><Glyph w={12} sw={1.6} /></span>
                <span className="sec__title">{t.label}</span>
                <span className="sec__line" />
              </header>
              <div className="sec__cards">
                {list.map((m) => <MedCard key={m.id} med={m} onTap={logMed} onUndo={undoMed} onEdit={onEdit} />)}
              </div>
            </section>
          );
        })}
      </div>

      <div className="footer">
        <button className="btn btn--primary" onClick={onOpenAdd}>
          <Icons.plus w={16} sw={2} /> Add medication
        </button>
      </div>
    </div>
  );
}
