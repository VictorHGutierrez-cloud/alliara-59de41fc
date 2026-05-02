import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PdmEntry = { id: string; name: string };

/**
 * Roster of PDMs (and leadership) available to be assigned as owners.
 * Pulls everyone with a role of 'pdm', 'leadership' or 'admin', joined with profiles.
 */
export function usePdmRoster() {
  const [pdms, setPdms] = useState<PdmEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["pdm", "leadership", "admin"]);
      const ids = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
      if (ids.length === 0) {
        if (!cancelled) { setPdms([]); setLoading(false); }
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      if (cancelled) return;
      const byId = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "Unnamed"]));
      const list: PdmEntry[] = ids
        .map((id) => ({ id, name: byId.get(id) ?? id.slice(0, 8) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setPdms(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { pdms, loading };
}
