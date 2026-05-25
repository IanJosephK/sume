import { Icons } from "../components/Icons";
import { useThemeStore } from "../stores/useThemeStore";
import { WEEK_STRIP, HISTORY_DAYS } from "../lib/constants";

interface HistoryScreenProps {
  onGoToday: () => void;
}

export function HistoryScreen({ onGoToday }: HistoryScreenProps) {
  const { theme, toggleTheme } = useThemeStore();

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
          {WEEK_STRIP.map((d, i) => (
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

      <div className="histList">
        {HISTORY_DAYS.map((day) => (
          <section className="histDay" key={day.id}>
            <header className="histDay__h">
              <div className="histDay__title">
                <span className="histDay__lbl">{day.label}</span>
                <span className="histDay__sub">{day.sub}</span>
              </div>
              <div className="histDay__sum">{day.summary}</div>
            </header>
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
          </section>
        ))}
      </div>
    </div>
  );
}
