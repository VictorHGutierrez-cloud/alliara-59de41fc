import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Centralised leadership/admin probe.
 * Mirrors the inline check used in partners-store / leads-store / diagnostic
 * so screens that need to gate "manage on someone else's behalf" actions
 * can opt in without duplicating Supabase calls.
 */
export function useLeadership(userId: string | undefined): {
  isLeadership: boolean;
  loading: boolean;
} {
  const [isLeadership, setIsLeadership] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setIsLeadership(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error || !data) {
        setIsLeadership(false);
        setLoading(false);
        return;
      }
      setIsLeadership(
        data.some((r) => r.role === "leadership" || r.role === "admin"),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isLeadership, loading };
}
