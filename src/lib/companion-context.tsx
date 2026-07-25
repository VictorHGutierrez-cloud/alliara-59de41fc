import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  type CompanionId,
  getCompanion,
  hasChosenCompanion,
  setCompanion as persistCompanion,
} from "@/lib/companion";

type CompanionContextValue = {
  companion: CompanionId;
  hasChosen: boolean;
  setCompanion: (id: CompanionId) => void;
  refresh: () => void;
};

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [companion, setCompanionState] = useState<CompanionId>(() => getCompanion());
  const [hasChosen, setHasChosen] = useState(() => hasChosenCompanion());

  const refresh = useCallback(() => {
    setCompanionState(getCompanion());
    setHasChosen(hasChosenCompanion());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener("kept-companion-changed", onChange);
    return () => window.removeEventListener("kept-companion-changed", onChange);
  }, [refresh]);

  const setCompanion = useCallback((id: CompanionId) => {
    persistCompanion(id);
    setCompanionState(id);
    setHasChosen(true);
  }, []);

  return (
    <CompanionContext.Provider value={{ companion, hasChosen, setCompanion, refresh }}>
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion(): CompanionContextValue {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    return {
      companion: getCompanion(),
      hasChosen: hasChosenCompanion(),
      setCompanion: persistCompanion,
      refresh: () => undefined,
    };
  }
  return ctx;
}
