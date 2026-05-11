import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Maximize2, Plus, Send, Sparkles, X } from "lucide-react";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildKeptContext,
  clearKeptMessages,
  loadKeptMessages,
  saveKeptMessages,
  subscribeKeptMessages,
  type KeptMsg,
} from "@/lib/kept-context";
import { keptVariantForAppPath } from "@/lib/kept-route-variant";
import { COPY } from "@/lib/copy";

const SUGGESTIONS = [
  "How is my portfolio right now?",
  "Which partners have no open actions?",
  "Give me a next-step idea for a tier 2 partner.",
];

/**
 * Floating Kept chat dock — single conversation persisted in localStorage.
 * Shared with the /kept/ask full-page surface via kept-context.ts helpers.
 */
export function KeptChatDock() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<KeptMsg[]>(() => loadKeptMessages());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hide on intro tour and on the dedicated /kept/ask page (which has its own surface).
  const hidden = path === "/intro" || path === "/kept/ask";

  useEffect(() => subscribeKeptMessages(() => setMessages(loadKeptMessages())), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => textareaRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  const variant = keptVariantForAppPath(path);

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
      const content = (data as { content?: string })?.content ?? "(no answer)";
      const final: KeptMsg[] = [...next, { role: "assistant", content }];
      setMessages(final);
      saveKeptMessages(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (busy) return;
    clearKeptMessages();
    setMessages([]);
    setError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="pointer-events-auto fixed bottom-5 right-5 z-[45] lg:bottom-8 lg:right-8">
      {open ? (
        <div
          role="dialog"
          aria-label="Kept assistant"
          className="flex h-[min(560px,80vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <KeptIllustration variant={variant} className="h-9 w-auto shrink-0 object-contain" decorative />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Kept</p>
              <p className="truncate text-[11px] text-muted-foreground">Ask anything</p>
            </div>
            <button
              type="button"
              onClick={startNew}
              disabled={busy || messages.length === 0}
              title="New conversation"
              aria-label="New conversation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Link
              to="/kept/ask"
              title="Open full screen"
              aria-label="Open full screen"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && !busy ? (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggestions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInput(s)}
                      className="rounded-full border border-border/70 bg-surface/60 px-2.5 py-1 text-[11px] text-foreground hover:border-primary/40 hover:bg-surface"
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
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-3 py-1.5 text-[13px] text-primary-foreground">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                    {m.content}
                  </div>
                )}
              </div>
            ))}

            {busy ? (
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Kept is thinking…
              </div>
            ) : null}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          {/* Composer */}
          <div className="border-t border-border/60 p-2">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                disabled={busy}
                placeholder="Ask Kept…"
                className="min-h-[40px] flex-1 resize-none rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-ring disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          title={COPY.kept.ambientTitle}
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-border/80 bg-card/95 p-2 shadow-lg backdrop-blur-sm transition hover:border-primary/35 hover:shadow-xl"
        >
          <KeptIllustration variant={variant} className="h-[52px] w-auto max-w-[76px] object-contain" decorative />
          <span className="sr-only">Open Kept</span>
        </button>
      )}
    </div>
  );
}