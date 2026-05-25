import { motion } from "framer-motion";
import { Icons } from "./Icons";
import { fmtCountdown } from "../lib/helpers";
import type { Medication } from "../lib/types";

interface MedCardProps {
  med: Medication;
  onTap: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (med: Medication) => void;
}

export function MedCard({ med, onTap, onUndo, onEdit }: MedCardProps) {
  const Icon = Icons[med.icon] || Icons.pill;
  return (
    <motion.div
      className={`card card--${med.status}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      layout
    >
      <div className={`card__icon sw-${med.color}`} onClick={() => onEdit(med)} style={{ cursor: "pointer" }}><Icon w={18} /></div>
      <div className="card__body">
        <div className="card__row1" onClick={() => onEdit(med)} style={{ cursor: "pointer" }}>
          <span className="card__name">{med.name}</span>
          <span className="card__dose">{med.dose}</span>
          <span className="card__edit"><Icons.chevRight w={11} sw={1.6} /></span>
        </div>

        {med.status === "pending" && med.note && <div className="card__note">{med.note}</div>}
        {med.status === "pending" && (
          <button className="card__cta" onClick={() => onTap(med.id)}>
            tap to log <Icons.chevRight w={13} sw={1.8} />
          </button>
        )}

        {med.status === "taken" && (
          <div className="card__meta">
            <span className="card__time">logged at {med.takenAt}</span>
            <button className="card__undo" onClick={() => onUndo(med.id)}>
              <Icons.undo w={12} sw={1.8} /> undo
            </button>
          </div>
        )}

        {med.status === "timing" && med.timer && (
          <div>
            {med.note && <div className="card__note">{med.note}</div>}
            <div className="card__timerRow">
              <span className="timer-dot" />
              <span className="timer-num">{fmtCountdown(med.timer.remaining)}</span>
              <span className="timer-tail">until {med.timer.message.toLowerCase()}</span>
            </div>
            <div className="card__meta">
              <span className="card__time">logged at {med.takenAt}</span>
              <button className="card__undo" onClick={() => onUndo(med.id)}>
                <Icons.undo w={12} sw={1.8} /> undo
              </button>
            </div>
          </div>
        )}

        {med.status === "done" && med.timer && (
          <div>
            <div className="done-banner">
              <Icons.check w={13} sw={2.2} />
              <span>{med.timer.message}</span>
            </div>
            <div className="card__meta">
              <span className="card__time">logged at {med.takenAt}</span>
              <button className="card__undo" onClick={() => onUndo(med.id)}>
                <Icons.undo w={12} sw={1.8} /> undo
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
