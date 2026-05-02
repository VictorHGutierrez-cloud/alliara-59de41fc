import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OwnerScope = "mine" | "all";

/**
 * Shared "view scope + PDM filter" logic for leadership users.
 * - Defaults scope to "all" once isLeadership flips true (one-shot, until user touches).
 * - Resolves owner display names for the dropdown.
 * - Returns a filter function and the list of owners present in items.
 */
export function useOwnerScope<T>(opts: {
  items: T[];
  getOwnerId: (item: T) => string;
  isLeadership: boolean;
  currentUserId: string | undefined;
}) {
  const { items, getOwnerId, isLeadership, currentUserId } = opts;
  const [scope, setScopeState] = useState<OwnerScope>("mine");
  const [ownerFilter, setOwnerFilter] = useState<string | "all">("all");
  const [touched, setTouched] = useState(false);
  const [ownerNames, setOwnerNames] = useState<Map<string, string>>(new Map());

  // Default to "all" the first time we learn the user is leadership.
  useEffect(() => {
    if (isLeadership && !touched) setScopeState("all");
  }, [isLeadership, touched]);

  const setScope = (s: OwnerScope) => {
    setTouched(true);
    setScopeState(s);
    if (s === "mine") setOwnerFilter("all");
  };

  // Fetch display names for unique owners.
  useEffect(() => {
    if (!isLeadership || items.length === 0) return;
    const ids = Array.from(new Set(items.map(getOwnerId)));
    const missing = ids.filter((id) => !ownerNames.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("profiles").select("id, display_name").in("id", missing);
      if (cancelled || !data) return;
      setOwnerNames((prev) => {
        const next = new Map(prev);
        for (const row of data as { id: string; display_name: string | null }[]) {
          next.set(row.id, row.display_name ?? "Unnamed PDM");
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeadership, items]);

  const ownersInScope = useMemo(() => {
    const ids = Array.from(new Set(items.map(getOwnerId)));
    return ids
      .map((id) => ({ id, name: ownerNames.get(id) ?? id.slice(0, 8) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ownerNames]);

  const applyFilter = (item: T): boolean => {
    const oid = getOwnerId(item);
    if (scope === "mine") return oid === currentUserId;
    if (ownerFilter !== "all") return oid === ownerFilter;
    return true;
  };

  return { scope, setScope, ownerFilter, setOwnerFilter, ownersInScope, ownerNames, applyFilter };
}