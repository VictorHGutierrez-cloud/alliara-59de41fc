import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COPY } from "@/lib/copy";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { KeptAiChat, type KeptChatMessage } from "@/components/kept/KeptAiChat";

const STORAGE_KEY = "kept-academy-ask-messages";

type CoachContext = {
  topic?: string;
  slug?: string;
  source?: "library" | "briefing" | "dock";
};

function loadMessages(): KeptChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KeptChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: KeptChatMessage[]) {
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
    const slug =
      typeof search.slug === "string" && search.slug.trim()
        ? search.slug.trim().slice(0, 80)
        : undefined;
    const source =
      search.source === "library" || search.source === "briefing" || search.source === "dock"
        ? search.source
        : undefined;
    return {
      ...(topic ? { topic } : {}),
      ...(draft ? { draft } : {}),
      ...(slug ? { slug } : {}),
      ...(source ? { source } : {}),
    };
  },
  component: AcademyAskPage,
});

function AcademyAskPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [messages, setMessages] = useState<KeptChatMessage[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextTopic, setContextTopic] = useState<string | undefined>(undefined);
  const coachContext = useRef<CoachContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedSearch = useRef(false);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (appliedSearch.current) return;
    if (!search.draft && !search.topic && !search.slug) return;
    appliedSearch.current = true;
    if (search.draft) setInput(search.draft);
    if (search.topic) setContextTopic(search.topic);
    coachContext.current = {
      topic: search.topic,
      slug: search.slug,
      source: search.source,
    };
    void nav({
      to: "/academy/ask",
      search: {},
      replace: true,
    });
  }, [search.draft, search.topic, search.slug, search.source, nav]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const next: KeptChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    saveMessages(next);
    setBusy(true);
    try {
      const ctx = coachContext.current;
      const { data, error: err } = await supabase.functions.invoke("sales-ask", {
        body: {
          question: q,
          history: messages.slice(-12),
          ...(ctx.topic || ctx.slug || ctx.source ? { context: ctx } : {}),
        },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const final: KeptChatMessage[] = [
        ...next,
        { role: "assistant", content: content || "(no answer)" },
      ];
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
    coachContext.current = {};
    setInput("");
  }

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-4xl flex-col px-4 py-4 pb-24 sm:px-6 lg:pb-4">
      <Link
        to="/academy"
        className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {COPY.academy.backToHub}
      </Link>

      <div className="mt-2 min-h-0 flex-1">
        <KeptAiChat
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={() => void send()}
          onNewChat={startNew}
          busy={busy}
          error={error}
          contextTopic={contextTopic}
          scrollRef={scrollRef}
        />
      </div>
    </div>
  );
}
