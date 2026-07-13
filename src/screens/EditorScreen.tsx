import { useState } from "react";
import { Icons } from "../components/Icons";
import { Stepper } from "../components/Stepper";
import { useMedStore } from "../stores/useMedStore";
import { TIMES, SWATCH_ORDER, ICON_ORDER } from "../lib/constants";
import type { Medication, TimeOfDay, IconName, SwatchColor } from "../lib/types";

interface EditorScreenProps {
  initial: Medication | null;
  onClose: () => void;
}

export function EditorScreen({ initial, onClose }: EditorScreenProps) {
  const { addMed, updateMed, deleteMed } = useMedStore();
  const isEdit = !!initial;

  const [name, setName]         = useState(initial?.name ?? "");
  const [dose, setDose]         = useState(initial?.dose ?? "");
  const [note, setNote]         = useState(initial?.note ?? "");
  const [icon, setIcon]         = useState<IconName>(initial?.icon ?? "pill");
  const [color, setColor]       = useState<SwatchColor>(initial?.color ?? "coral");
  const [timerOn, setTimerOn]   = useState(initial?.timer ? true : false);
  const [timerMin, setTimerMin] = useState(initial?.timer?.minutes ?? 30);
  const [timerMsg, setTimerMsg] = useState(initial?.timer?.message ?? "You can eat now");
  const [reminderOn, setReminderOn] = useState(!!initial?.reminder);
  const [reminderTime, setReminderTime] = useState(initial?.reminder ?? "08:00");
  const [delConfirm, setDelConfirm] = useState(false);
  const [whenSet, setWhenSet]   = useState<Set<TimeOfDay>>(new Set(initial?.times ?? []));

  const toggleWhen = (k: TimeOfDay) => {
    const s = new Set(whenSet);
    s.has(k) ? s.delete(k) : s.add(k);
    setWhenSet(s);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const times = whenSet.size > 0 ? [...whenSet] : ["morning" as TimeOfDay];
    const data = {
      name: name.trim(),
      dose: dose.trim(),
      times,
      note: note.trim(),
      icon,
      color,
      timer: timerOn ? { minutes: timerMin, message: timerMsg || "Done" } : null,
      reminder: reminderOn ? reminderTime : null,
    };
    if (isEdit && initial) {
      await updateMed(initial.id, data);
    } else {
      await addMed(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (delConfirm) {
      await deleteMed(initial.id);
      onClose();
    } else {
      setDelConfirm(true);
    }
  };

  return (
    <div className="screen">
      <header className="hdr hdr--edit">
        <button className="iconbtn" onClick={onClose}><Icons.chevLeft w={18} sw={1.8} /></button>
        <div className="hdr__title">{isEdit ? "Edit medication" : "New medication"}</div>
        <button className="iconbtn iconbtn--ghost" onClick={onClose}><Icons.x w={16} sw={1.8} /></button>
      </header>

      <div className="form">
        <div className="field">
          <label className="field__lbl">Name</label>
          <input className="input input--big" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pantoprazole" />
        </div>

        <div className="field">
          <label className="field__lbl">Dosage <span className="field__opt">optional</span></label>
          <input className="input" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 40 mg" />
        </div>

        <div className="field">
          <label className="field__lbl">When to take</label>
          <div className="chips">
            {TIMES.map((t) => (
              <button key={t.key} className={"chip " + (whenSet.has(t.key) ? "chip--on" : "")}
                      onClick={() => toggleWhen(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__lbl">Note <span className="field__opt">optional</span></label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. with food" />
        </div>

        <div className="field">
          <label className="field__lbl">Icon</label>
          <div className="iconpicker">
            {ICON_ORDER.map((k) => {
              const I = Icons[k];
              const on = icon === k;
              return (
                <button key={k} className={"iconpick " + (on ? `iconpick--on sw-${color}` : "")}
                        onClick={() => setIcon(k)}>
                  <I w={18} sw={1.6} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label className="field__lbl">Color</label>
          <div className="colorpicker">
            {SWATCH_ORDER.map((k) => (
              <button key={k} className={`dot sw-${k} ` + (color === k ? "dot--on" : "")}
                      onClick={() => setColor(k)}>
                {color === k && <span className="dot__check"><Icons.check w={14} sw={2.4} /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="field field--toggleRow">
          <div className="toggleRow">
            <div>
              <div className="field__lbl no-mb">Daily reminder</div>
              <div className="field__hint">Get notified if you haven't taken it yet</div>
            </div>
            <button className={"switch " + (reminderOn ? "switch--on" : "")} onClick={() => setReminderOn(!reminderOn)}>
              <span className="switch__knob" />
            </button>
          </div>
          {reminderOn && (
            <div className="timerBox">
              <div className="timerBox__row">
                <label className="field__lbl no-mb">Remind at</label>
                <input type="time" className="input reminder-time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="field field--toggleRow">
          <div className="toggleRow">
            <div>
              <div className="field__lbl no-mb">Timer after taking</div>
              <div className="field__hint">Reminds you when it's safe to eat, sleep, etc.</div>
            </div>
            <button className={"switch " + (timerOn ? "switch--on" : "")} onClick={() => setTimerOn(!timerOn)}>
              <span className="switch__knob" />
            </button>
          </div>
          {timerOn && (
            <div className="timerBox">
              <div className="timerBox__row">
                <label className="field__lbl no-mb">Duration</label>
                <Stepper val={timerMin} onChange={setTimerMin} />
              </div>
              <div className="timerBox__row col">
                <label className="field__lbl">Completion message</label>
                <input className="input" value={timerMsg} onChange={(e) => setTimerMsg(e.target.value)} placeholder="e.g. You can eat now" />
              </div>
            </div>
          )}
        </div>

        {isEdit && (
          <div className="field">
            <button className={"del " + (delConfirm ? "del--confirm" : "")} onClick={handleDelete}>
              <Icons.trash w={14} sw={1.7} />
              <span>{delConfirm ? "Tap again to confirm delete" : "Delete medication"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave}
                disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.45 }}>
          <Icons.check w={15} sw={2} /> Save
        </button>
      </div>
    </div>
  );
}
