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
      const { data, error } = await supabase.rpc("list_pdm_roster");
      if (cancelled) return;
      if (error || !data) {
        setPdms([]);
        setLoading(false);
        return;
      }
      const list: PdmEntry[] = (data as { id: string; display_name: string | null }[])
        .map((r) => ({ id: r.id, name: r.display_name?.trim() || r.id.slice(0, 8) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setPdms(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { pdms, loading };
}
