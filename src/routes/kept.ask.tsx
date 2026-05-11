import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export const Route = createFileRoute("/kept/ask")({
  head: () => ({ meta: [{ title: "Ask Kept" }] }),
  component: KeptAskPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function KeptAskPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    try {
      // Pull a compact portfolio snapshot so Kept can answer about specific partners.
      let context: Record<string, unknown> = {};
      if (user) {
        const [{ data: partners }, { data: profile }] = await Promise.all([
          supabase
            .from("partners")
            .select("id, name, company, segment, tier, status, partner_type, notes")
            .eq("owner_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(80),
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        ]);
        const ids = (partners ?? []).map((p) => p.id);
        const [{ data: ass }, { data: acts }] = ids.length
          ? await Promise.all([
              supabase.from("assessments").select("partner_id, overall, created_at").in("partner_id", ids).order("created_at", { ascending: false }),
              supabase.from("action_plans").select("partner_id, status").in("partner_id", ids).neq("status", "done"),
            ])
          : [{ data: [] as Array<{ partner_id: string; overall: number; created_at: string }> }, { data: [] as Array<{ partner_id: string; status: string }> }];
        const latestByPartner = new Map<string, number>();
        for (const a of (ass ?? []) as Array<{ partner_id: string; overall: number }>) {
          if (!latestByPartner.has(a.partner_id)) latestByPartner.set(a.partner_id, Number(a.overall));
        }
        const openByPartner = new Map<string, number>();
        for (const a of (acts ?? []) as Array<{ partner_id: string }>) {
          openByPartner.set(a.partner_id, (openByPartner.get(a.partner_id) ?? 0) + 1);
        }
        context = {
          pdmName: profile?.display_name ?? null,
          partners: (partners ?? []).map((p) => ({
            name: p.name,
            company: p.company,
            segment: p.segment,
            tier: p.tier,
            status: p.status,
            partner_type: p.partner_type,
            notes: p.notes,
            health: latestByPartner.get(p.id) ?? null,
            open_actions: openByPartner.get(p.id) ?? 0,
          })),
        };
      }
      const { data, error: err } = await supabase.functions.invoke("kept-ask", {
        body: { question: q, history: messages.slice(-12), context },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      setMessages([...next, { role: "assistant", content: content || "(no answer)" }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [
    "Como faço para um parceiro entrar nas minhas weeklies?",
    "O que é um bom JBP para um parceiro tier 2?",
    "Como acelerar co-sell sem queimar a relação?",
  ];

  return (
    <div className="page-shell max-w-3xl">
      <Link to="/partners" className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-h-11">
        <ArrowLeft className="h-3.5 w-3.5" /> back
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <KeptIllustration variant="keepsContext" className="h-12 w-auto" decorative />
        <div>
          <h1 className="page-title">Pergunte ao Kept</h1>
          <p className="page-subtitle">Qualquer dúvida sobre parceiros, co-sell, enablement ou estratégia.</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 max-h-[55vh] min-h-[200px] overflow-y-auto rounded-2xl border border-border/70 bg-card/60 p-4 space-y-4"
      >
        {messages.length === 0 && !busy ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Sugestões para começar:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border/70 bg-surface/60 px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-surface"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[95%] text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {m.content}
              </div>
            )}
          </div>
        ))}

        {busy ? (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Kept está pensando…
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          disabled={busy}
          placeholder="Pergunte qualquer coisa para o Kept…"
          className="resize-none min-h-[56px] flex-1 rounded-xl"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          className="inline-flex h-[56px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </div>
  );
}