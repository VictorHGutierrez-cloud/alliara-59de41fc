import { supabase } from "@/integrations/supabase/client";
import { HubSpotOfflineError, isHubSpotOfflineError } from "@/lib/hubspot-connection";

function rethrow(err: unknown): never {
  if (isHubSpotOfflineError(err)) {
    throw new HubSpotOfflineError(
      "Integração HubSpot pausada — reative em Settings quando o token estiver disponível.",
    );
  }
  throw err instanceof Error ? err : new Error(String(err));
}

export async function startHubSpotOAuth(): Promise<{ authorizeUrl: string }> {
  const { data, error } = await supabase.functions.invoke("hubspot-oauth-start", {
    method: "POST",
  });
  if (error) rethrow(error);
  const d = data as { authorizeUrl?: string; error?: string };
  if (!d?.authorizeUrl) rethrow(new Error(d?.error ?? "No authorize URL"));
  return { authorizeUrl: d.authorizeUrl };
}

export async function syncHubSpot(): Promise<{ ok: boolean; companies: number; deals: number }> {
  const { data, error } = await supabase.functions.invoke("hubspot-sync", { method: "POST" });
  if (error) rethrow(error);
  const d = data as { ok?: boolean; companies?: number; deals?: number; error?: string };
  if (!d?.ok) rethrow(new Error(d?.error ?? "Sync failed"));
  return { ok: true, companies: d.companies ?? 0, deals: d.deals ?? 0 };
}

export async function synthesizeHubSpotDigest(body: {
  partner_id?: string;
  hs_company_id?: number;
}): Promise<{
  ok: boolean;
  digest: HubspotDigestJson;
  hs_company_id: number;
}> {
  const { data, error } = await supabase.functions.invoke("hubspot-synthesize", { body });
  if (error) rethrow(error);
  const d = data as {
    ok?: boolean;
    digest?: HubspotDigestJson;
    hs_company_id?: number;
    error?: string;
  };
  if (!d?.ok || d.digest == null) rethrow(new Error(d?.error ?? "Synthesis failed"));
  return {
    ok: true,
    digest: d.digest,
    hs_company_id: d.hs_company_id ?? 0,
  };
}

export interface HubspotDigestJson {
  executive_summary?: string;
  bullets?: string[];
  risk?: string;
  next_steps?: Array<{ title: string; detail: string; hs_citation?: string }>;
}

export async function writeHubSpotCompanyNote(params: {
  hs_company_id: number;
  body: string;
}): Promise<{ ok: boolean; hs_note_id: string | null }> {
  const { data, error } = await supabase.functions.invoke("hubspot-write-note", { body: params });
  if (error) rethrow(error);
  const d = data as { ok?: boolean; hs_note_id?: string | null; error?: string; detail?: string };
  if (!d?.ok) rethrow(new Error(d?.error ?? d?.detail ?? "Write failed"));
  return { ok: true, hs_note_id: d.hs_note_id ?? null };
}
