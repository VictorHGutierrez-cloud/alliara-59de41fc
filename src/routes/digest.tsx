import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  synthesizeHubSpotDigest,
  writeHubSpotCompanyNote,
  type HubspotDigestJson,
} from "@/lib/hubspot-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];
type CompanyCache = Database["public"]["Tables"]["hubspot_company_cache"]["Row"];

export const Route = createFileRoute("/digest")({
  head: () => ({
    meta: [
      { title: "Weekly digest · Alliara" },
      { name: "description", content: "HubSpot-grounded partner brief and next step." },
    ],
  }),
  component: DigestPage,
});

function DigestPage() {
  const { user, loading: authLoading } = useAuth();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [companies, setCompanies] = useState<CompanyCache[]>([]);
  const [connLoading, setConnLoading] = useState(true);
  const [hasConnection, setHasConnection] = useState(false);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [digest, setDigest] = useState<HubspotDigestJson | null>(null);
  const [hsCompanyId, setHsCompanyId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setConnLoading(true);
      const { data: conn } = await supabase.from("hubspot_connections").select("id").maybeSingle();
      if (cancelled) return;
      setHasConnection(Boolean(conn));
      const { data: plist } = await supabase
        .from("partners")
        .select("*")
        .eq("owner_id", user.id)
        .order("name");
      if (cancelled) return;
      setPartners((plist ?? []) as PartnerRow[]);

      if (conn?.id) {
        const { data: comps } = await supabase
          .from("hubspot_company_cache")
          .select("*")
          .eq("connection_id", conn.id)
          .order("synced_at", { ascending: false })
          .limit(200);
        if (!cancelled) setCompanies((comps ?? []) as CompanyCache[]);
      }
      setConnLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) ?? null;

  const runDigest = useCallback(async () => {
    if (!selectedPartnerId || !selectedPartner) {
      toast.error("Select a partner.");
      return;
    }
    if (selectedPartner.hubspot_company_id == null) {
      toast.error("Set HubSpot company ID in Edit partner first.");
      return;
    }
    setGenerating(true);
    setDigest(null);
    try {
      const res = await synthesizeHubSpotDigest({ partner_id: selectedPartnerId });
      setDigest(res.digest);
      setHsCompanyId(res.hs_company_id);
      toast.success("Digest ready.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [selectedPartnerId, selectedPartner]);

  const pushNote = useCallback(async () => {
    if (!digest || hsCompanyId == null) return;
    const body = [
      `Alliara digest — ${new Date().toISOString().slice(0, 10)}`,
      "",
      digest.executive_summary ?? "",
      "",
      ...(digest.bullets ?? []).map((b) => `• ${b}`),
      "",
      "Next steps:",
      ...(digest.next_steps ?? []).map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`),
    ].join("\n");

    setWriting(true);
    try {
      await writeHubSpotCompanyNote({ hs_company_id: hsCompanyId, body });
      toast.success("Note added on the company in HubSpot.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWriting(false);
    }
  }, [digest, hsCompanyId]);

  if (authLoading) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell">
        <p className="text-muted-foreground">Sign in to view your digest.</p>
        <Link to="/login" className="text-primary underline mt-4 inline-block min-h-11">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-3xl space-y-8">
      <div>
        <p className="page-eyebrow">HubSpot · Weekly rhythm</p>
        <h1 className="page-title mt-1">Partner digest</h1>
        <p className="page-subtitle mt-2">
          One brief grounded in your CRM. Link each partner to a HubSpot company ID, sync from
          Settings, then generate a digest and optionally log it as a note on the company.
        </p>
      </div>

      {connLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : !hasConnection ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect HubSpot</CardTitle>
            <CardDescription>
              Open Settings and connect your HubSpot portal, then run a sync before generating a
              digest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Choose partner</CardTitle>
              <CardDescription>
                The partner must have a HubSpot company ID (set in Edit partner). Companies synced:{" "}
                {companies.length}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="input w-full max-w-md"
                value={selectedPartnerId ?? ""}
                onChange={(e) => {
                  setSelectedPartnerId(e.target.value || null);
                  setDigest(null);
                }}
              >
                <option value="">Select…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.hubspot_company_id ? ` · HS ${p.hubspot_company_id}` : " · no HS id"}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={generating || !selectedPartnerId}
                  onClick={() => void runDigest()}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Generate digest
                </Button>
              </div>
            </CardContent>
          </Card>

          {digest && (
            <Card>
              <CardHeader>
                <CardTitle>Brief</CardTitle>
                <CardDescription>Risk: {digest.risk ?? "—"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{digest.executive_summary}</p>
                <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  {(digest.bullets ?? []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div>
                  <p className="text-xs font-mono uppercase text-muted-foreground mb-2">
                    Next steps
                  </p>
                  <ol className="list-decimal pl-5 text-sm space-y-2">
                    {(digest.next_steps ?? []).map((s, i) => (
                      <li key={i}>
                        <span className="font-medium">{s.title}</span> — {s.detail}
                      </li>
                    ))}
                  </ol>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={writing || hsCompanyId == null}
                  onClick={() => void pushNote()}
                >
                  {writing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Log to HubSpot as note
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
