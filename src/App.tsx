import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TodayScreen } from "./screens/TodayScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { useMedStore } from "./stores/useMedStore";
import { useThemeStore, applyTheme } from "./stores/useThemeStore";
import { nowHHMM } from "./lib/helpers";
import { requestNotificationPermission } from "./lib/notifications";
import type { Medication } from "./lib/types";

type Screen = "today" | "history" | "edit";

function StatusBar() {
  const [t, setT] = useState(nowHHMM());
  useEffect(() => {
    const id = setInterval(() => setT(nowHHMM()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="phone__status">
      <span>{t}</span>
      <div className="dots"><span /><span /><span /><span /></div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const { loaded, loadMeds } = useMedStore();
  const { theme, accent } = useThemeStore();

  // Load meds from Dexie on mount
  useEffect(() => { loadMeds(); }, [loadMeds]);

  // Apply theme + accent to DOM
  useEffect(() => { applyTheme(theme, accent); }, [theme, accent]);

  // Request notification permission on first interaction
  useEffect(() => {
    const handler = () => {
      requestNotificationPermission();
      window.removeEventListener("click", handler);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Register PWA service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      import("virtual:pwa-register").then(({ registerSW }) => {
        registerSW({ immediate: true });
      }).catch(() => {});
    }
  }, []);

  if (!loaded) return null;

  const openAdd = () => { setEditingMed(null); setScreen("edit"); };
  const openEdit = (med: Medication) => { setEditingMed(med); setScreen("edit"); };
  const closeEdit = () => setScreen("today");

  return (
    <div className="phone">
      <StatusBar />
      <AnimatePresence mode="wait">
        {screen === "today" && (
          <motion.div key="today" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <TodayScreen onOpenAdd={openAdd} onGoHistory={() => setScreen("history")} onEdit={openEdit} />
          </motion.div>
        )}
        {screen === "history" && (
          <motion.div key="history" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <HistoryScreen onGoToday={() => setScreen("today")} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {screen === "edit" && (
          <motion.div
            key="editor"
            className="screen-slide"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <EditorScreen initial={editingMed} onClose={closeEdit} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
