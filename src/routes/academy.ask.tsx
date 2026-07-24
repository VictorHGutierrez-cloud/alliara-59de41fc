import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownProse } from "@/components/ui/markdown-prose";
import { COPY } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { cn } from "@/lib/utils";

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
  validateSearch: (search: Record<string, unknown>) => {
    const topic =
      typeof search.topic === "string" && search.topic.trim()
        ? search.topic.trim().slice(0, 200)
        : undefined;
    const draft =
      typeof search.draft === "string" && search.draft.trim()
        ? search.draft.trim().slice(0, 600)
        : undefined;
    return {
      ...(topic ? { topic } : {}),
      ...(draft ? { draft } : {}),
    };
  },
  component: AcademyAskPage,
});

function ThinkingSkeleton() {
  return (
    <div className="mr-4 space-y-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-[var(--shadow-card)]" aria-live="polite">
      <p className="text-xs font-medium text-muted-foreground">{COPY.academy.askThinking}</p>
      <Skeleton className="h-3 w-[88%] rounded-full" />
      <Skeleton className="h-3 w-[72%] rounded-full" />
      <Skeleton className="h-3 w-[56%] rounded-full" />
    </div>
  );
}

function AcademyAskPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [messages, setMessages] = useState<Msg[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextTopic, setContextTopic] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedSearch = useRef(false);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (appliedSearch.current) return;
    if (!search.draft && !search.topic) return;
    appliedSearch.current = true;
    if (search.draft) setInput(search.draft);
    if (search.topic) setContextTopic(search.topic);
    void nav({
      to: "/academy/ask",
      search: {},
      replace: true,
    });
  }, [search.draft, search.topic, nav]);

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
    setContextTopic(undefined);
    setInput("");
  }

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-2 shrink-0 lg:justify-end">
        <Link
          to="/academy"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          {COPY.academy.backToHub}
        </Link>
        <button
          type="button"
          onClick={startNew}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-[var(--shadow-card)] hover:bg-surface-2 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {COPY.academy.askNewChat}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3 shrink-0">
        <KeptIllustration variant="keepsContext" className="h-12 w-auto" decorative />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{COPY.academy.askTitle}</h1>
          <p className="text-xs text-muted-foreground">{COPY.academy.askSubtitle}</p>
        </div>
      </div>

      {contextTopic ? (
        <p className="mt-3 shrink-0 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">
          {COPY.academy.askContextBanner(contextTopic)}
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-surface-2/40 p-4"
      >
        {messages.length === 0 && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/40 text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
              {COPY.academy.askEmptyHint}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {COPY.academy.askSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="min-h-11 max-w-xs rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-xs font-medium leading-snug text-foreground shadow-[var(--shadow-card)] hover:bg-surface-2"
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
            className={cn(
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-tr-sm bg-primary/25 px-4 py-3 text-[15px] font-medium leading-relaxed text-foreground"
                : "mr-4 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-[var(--shadow-card)]",
            )}
          >
            {m.role === "assistant" ? <MarkdownProse content={m.content} variant="chat" /> : m.content}
          </div>
        ))}
        {busy && <ThinkingSkeleton />}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2 shrink-0 pb-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={COPY.academy.askPlaceholder}
          rows={2}
          className="min-h-[52px] resize-none text-[15px] leading-relaxed"
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
          className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] disabled:opacity-50 hover:opacity-90"
          aria-label={COPY.academy.askSendAria}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
