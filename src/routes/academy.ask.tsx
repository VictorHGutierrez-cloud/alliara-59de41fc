import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { COPY } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

const STORAGE_KEY = "kept-academy-ask-messages";

type Msg = { role: "user" | "assistant"; content: string };

function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Msg[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: Msg[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/academy/ask")({
  head: () => ({ meta: [{ title: COPY.academy.askMetaTitle }] }),
  component: AcademyAskPage,
});

function AcademyAskPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(() => loadMessages());
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
    saveMessages(next);
    setBusy(true);
    try {
      const { data, error: err } = await supabase.functions.invoke("sales-ask", {
        body: { question: q, history: messages.slice(-12) },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const final: Msg[] = [...next, { role: "assistant", content: content || "(no answer)" }];
      setMessages(final);
      saveMessages(final);
    } catch (e) {
      const msg = e instanceof Error ? e.message : COPY.academy.askErrorGeneric;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (busy) return;
    setMessages([]);
    saveMessages([]);
    setError(null);
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <Link
          to="/academy"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {COPY.academy.backToHub}
        </Link>
        <button
          type="button"
          onClick={startNew}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-2 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {COPY.academy.askNewChat}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3 shrink-0">
        <KeptIllustration variant="keepsContext" className="h-12 w-auto" decorative />
        <div>
          <h1 className="text-lg font-semibold">{COPY.academy.askTitle}</h1>
          <p className="text-xs text-muted-foreground">{COPY.academy.askSubtitle}</p>
        </div>
      </div>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card/50 p-4">
        {messages.length === 0 && (
          <div className="space-y-3 py-6 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-primary" />
            <p className="text-sm text-muted-foreground">{COPY.academy.askEmptyHint}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {COPY.academy.askSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-left hover:bg-surface-2 max-w-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2.5 text-sm"
                : "mr-4 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-2.5 text-sm whitespace-pre-wrap"
            }
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <p className="text-xs text-muted-foreground animate-pulse">{COPY.academy.askThinking}</p>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2 shrink-0 pb-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={COPY.academy.askPlaceholder}
          rows={2}
          className="min-h-[52px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          disabled={busy || !input.trim()}
          onClick={() => void send()}
          className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          aria-label={COPY.academy.askSendAria}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
