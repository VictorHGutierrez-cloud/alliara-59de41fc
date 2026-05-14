import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, PlugZap } from "lucide-react";
import { useHubSpotConnection } from "@/lib/hubspot-connection";
import { useAuth } from "@/lib/auth";

const DISMISS_KEY = "alliara-hubspot-offline-dismissed";

export function HubSpotOfflineBanner() {
  const { user } = useAuth();
  const { connected, loading } = useHubSpotConnection();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (connected) {
      try {
        sessionStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setDismissed(false);
    }
  }, [connected]);

  if (!user || loading || connected || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="border-b border-border/60 bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <PlugZap className="h-4 w-4 shrink-0 opacity-80" />
        <p className="min-w-0 flex-1 leading-relaxed">
          <span className="font-semibold">Modo offline do HubSpot ativo</span>
          <span className="opacity-80">
            {" "}
            — score, diagnóstico e portfolio funcionam normalmente.
          </span>
        </p>
        <Link
          to="/settings"
          className="shrink-0 rounded-md border border-amber-700/30 bg-white/60 px-3 py-1 font-medium text-amber-900 transition hover:bg-white dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/70"
        >
          Conectar agora →
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-amber-900/70 transition hover:bg-white/60 hover:text-amber-900 dark:text-amber-100/70 dark:hover:bg-amber-900/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}