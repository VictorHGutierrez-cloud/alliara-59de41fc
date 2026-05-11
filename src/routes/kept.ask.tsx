import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import {
  buildKeptContext,
  clearKeptMessages,
  loadKeptMessages,
  saveKeptMessages,
  subscribeKeptMessages,
  type KeptMsg,
} from "@/lib/kept-context";

export const Route = createFileRoute("/kept/ask")({
  head: () => ({ meta: [{ title: "Ask Kept" }] }),
  component: KeptAskPage,
});

function KeptAskPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState<KeptMsg[]>(() => loadKeptMessages());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => subscribeKeptMessages(() => setMessages(loadKeptMessages())), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const next: KeptMsg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    saveKeptMessages(next);
    setBusy(true);
    try {
      const context = user ? await buildKeptContext(user.id) : {};
      const { data, error: err } = await supabase.functions.invoke("kept-ask", {
        body: { question: q, history: messages.slice(-12), context },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const final: KeptMsg[] = [...next, { role: "assistant", content: content || "(no answer)" }];
      setMessages(final);
      saveKeptMessages(final);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (busy) return;
    clearKeptMessages();
    setMessages([]);
    setError(null);
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
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <KeptIllustration variant="keepsContext" className="h-12 w-auto" decorative />
          <div className="min-w-0">
            <h1 className="page-title">Pergunte ao Kept</h1>
            <p className="page-subtitle">Qualquer dúvida sobre parceiros, co-sell, enablement ou estratégia.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={startNew}
          disabled={busy || messages.length === 0}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-surface/60 px-3 text-xs text-foreground hover:border-primary/40 hover:bg-surface disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Nova conversa
        </button>
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