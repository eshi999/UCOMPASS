import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

// Tiny UI-only store: saved items + toast messages + the open resource sheet.
// BACKEND PLUG IN POINT: "saved" would persist to the user's account.

interface AppState {
  saved: Set<string>;
  toggleSave: (id: string, label?: string) => void;
  toast: (msg: string) => void;
  openResource: (id: string) => void;
  closeResource: () => void;
  resourceId: string | null;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set(['husky-harvest', 'rc1']));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const timer = useRef<number>();

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const toggleSave = useCallback(
    (id: string, label?: string) => {
      const wasSaved = saved.has(id);
      toast(wasSaved ? (label ? `Removed ${label}` : 'Removed from Saved') : label ? `Saved ${label}` : 'Saved');
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [saved, toast],
  );

  const value = useMemo(
    () => ({ saved, toggleSave, toast, resourceId, openResource: setResourceId, closeResource: () => setResourceId(null) }),
    [saved, toggleSave, toast, resourceId],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast ${toastMsg ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
