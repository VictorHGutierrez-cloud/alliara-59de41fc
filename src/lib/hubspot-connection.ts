import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export class HubSpotOfflineError extends Error {
  constructor(message = "HubSpot integration is offline") {
    super(message);
    this.name = "HubSpotOfflineError";
  }
}

const OFFLINE_HINTS = [
  "OAuth token expired",
  "HUBSPOT_ACCESS_TOKEN",
  "non-2xx",
  "No HubSpot connection",
  "Edge Function returned a non-2xx",
  "Failed to send a request to the Edge Function",
];

export function isHubSpotOfflineError(err: unknown): boolean {
  if (err instanceof HubSpotOfflineError) return true;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return OFFLINE_HINTS.some((h) => msg.toLowerCase().includes(h.toLowerCase()));
}

// Module-level cache so multiple components share the same lookup
let cached: { userId: string; connected: boolean; at: number } | null = null;
const TTL_MS = 60_000;
const listeners = new Set<() => void>();

export function invalidateHubSpotConnection() {
  cached = null;
  listeners.forEach((l) => l());
}

export function useHubSpotConnection(): { connected: boolean; loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<{ connected: boolean; loading: boolean }>(() => {
    if (user && cached && cached.userId === user.id && Date.now() - cached.at < TTL_MS) {
      return { connected: cached.connected, loading: false };
    }
    return { connected: false, loading: !!user };
  });

  useEffect(() => {
    if (!user) {
      setState({ connected: false, loading: false });
      return;
    }
    let cancelled = false;

    const load = async () => {
      if (cached && cached.userId === user.id && Date.now() - cached.at < TTL_MS) {
        setState({ connected: cached.connected, loading: false });
        return;
      }
      setState((s) => ({ ...s, loading: true }));
      const { data } = await supabase
        .from("hubspot_connections")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const connected = !!data;
      cached = { userId: user.id, connected, at: Date.now() };
      setState({ connected, loading: false });
    };

    const onChange = () => void load();
    listeners.add(onChange);
    void load();
    return () => {
      cancelled = true;
      listeners.delete(onChange);
    };
  }, [user]);

  return state;
}