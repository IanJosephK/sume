export function fmtCountdown(s: number): string {
  s = Math.max(0, s | 0);
  return `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getHeader(): { day: string; date: string } {
  const d = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return { day: days[d.getDay()], date: months[d.getMonth()] + " " + d.getDate() };
}

/** Format a local Date as YYYY-MM-DD without UTC conversion. */
function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return localISO(new Date());
}

/** Return an ISO date string for `daysAgo` days before today. */
export function daysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localISO(d);
}

/** Parse an ISO date string as a local-time Date (noon to avoid DST edge cases). */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Format an ISO date string as a short day name, e.g. "Mon". */
export function shortDay(iso: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parseISO(iso).getDay()];
}

/** Format an ISO date string as the day-of-month number. */
export function dayOfMonth(iso: string): string {
  return String(parseISO(iso).getDate());
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Format an ISO date as a human label: "Today", "Yesterday", or the day name. */
export function dayLabel(iso: string, todayStr: string): string {
  if (iso === todayStr) return "Today";
  const todayDate = parseISO(todayStr);
  const yest = new Date(todayDate);
  yest.setDate(yest.getDate() - 1);
  if (iso === localISO(yest)) return "Yesterday";
  return DAY_NAMES[parseISO(iso).getDay()];
}

/** Format an ISO date as a sub-label, e.g. "Mon, Jul 7". */
export function daySub(iso: string): string {
  const d = parseISO(iso);
  return `${DAY_NAMES[d.getDay()].slice(0, 3)}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}
