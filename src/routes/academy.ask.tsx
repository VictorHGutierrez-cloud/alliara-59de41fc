import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Flag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COPY } from "@/lib/copy";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { KeptAiChat, type KeptChatMessage } from "@/components/kept/KeptAiChat";
import {
  createSession,
  listRecentSessions,
  loadSession,
  saveSessionMessages,
  sessionBannerLabel,
  sessionToAskContext,
  type CoachSession,
} from "@/lib/coach-sessions";

const STORAGE_KEY = "kept-academy-ask-messages";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function loadLocalMessages(): KeptChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KeptChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: KeptChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    /* ignore */
  }
}

type AskSearch = {
  session?: string;
  topic?: string;
  draft?: string;
  slug?: string;
  source?: "library" | "briefing" | "dock" | "hub";
};

export const Route = createFileRoute("/academy/ask")({
  head: () => ({ meta: [{ title: COPY.academy.askMetaTitle }] }),
  validateSearch: (search: Record<string, unknown>): AskSearch => {
    const session =
      typeof search.session === "string" && isUuid(search.session.trim())
        ? search.session.trim()
        : undefined;
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
      search.source === "library" ||
      search.source === "briefing" ||
      search.source === "dock" ||
      search.source === "hub"
        ? search.source
        : undefined;
    return {
      ...(session ? { session } : {}),
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
  const [messages, setMessages] = useState<KeptChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CoachSession | null>(null);
  const [recent, setRecent] = useState<CoachSession[]>([]);
  const [loadingSession, setLoadingSession] = useState(Boolean(search.session));
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedLegacySearch = useRef(false);
  const loadedSessionId = useRef<string | null>(null);
  const legacyContext = useRef<{
    topic?: string;
    slug?: string;
    source?: "library" | "briefing" | "dock" | "hub";
  }>({});

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    void listRecentSessions(user.id, 5).then(setRecent);
  }, [user, session?.id]);

  useEffect(() => {
    if (!user) return;
    const sessionId = search.session;
    if (!sessionId) {
      if (!loadedSessionId.current) {
        setMessages(loadLocalMessages());
        setLoadingSession(false);
      }
      return;
    }
    if (loadedSessionId.current === sessionId) return;
    let cancelled = false;
    setLoadingSession(true);
    void loadSession(user.id, sessionId).then((row) => {
      if (cancelled) return;
      if (!row) {
        setError("Session not found.");
        setLoadingSession(false);
        return;
      }
      loadedSessionId.current = row.id;
      setSession(row);
      setMessages(row.messages);
      setError(null);
      setLoadingSession(false);
      if (row.messages.length === 0 && row.situation && row.mode !== "roleplay") {
        const opener =
          row.mode === "prep"
            ? `Help me prep this call. Goal: ${row.situation}`
            : row.mode === "briefing"
              ? `How should I use this on today's call? ${row.situation}`
              : `I'm stuck. Here's the situation: ${row.situation}`;
        setInput(opener);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, search.session]);

  useEffect(() => {
    if (search.session) return;
    if (appliedLegacySearch.current) return;
    if (!search.draft && !search.topic && !search.slug) return;
    appliedLegacySearch.current = true;
    if (search.draft) setInput(search.draft);
    legacyContext.current = {
      topic: search.topic,
      slug: search.slug,
      source: search.source,
    };
    void nav({
      to: "/academy/ask",
      search: {},
      replace: true,
    });
  }, [search.draft, search.topic, search.slug, search.source, search.session, nav]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const roleplayStartedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!session || session.mode !== "roleplay") return;
    if (session.messages.length > 0 || messages.length > 0) return;
    if (roleplayStartedFor.current === session.id) return;
    roleplayStartedFor.current = session.id;
    void startRoleplay(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, messages.length]);

  async function startRoleplay(active: CoachSession) {
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("sales-ask", {
        body: {
          question: "__start__",
          history: [],
          context: sessionToAskContext(active),
        },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const opening: KeptChatMessage[] = [
        { role: "assistant", content: content || "(no answer)" },
      ];
      setMessages(opening);
      saveLocalMessages(opening);
      await saveSessionMessages(active.id, opening);
      setSession({ ...active, messages: opening });
    } catch (e) {
      console.error("[AcademyAsk - startRoleplay]:", e);
      roleplayStartedFor.current = null;
      setError(e instanceof Error ? e.message : COPY.academy.askErrorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function endRoleplay() {
    if (busy || !user || !session || session.mode !== "roleplay") return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("sales-ask", {
        body: {
          question: "__debrief__",
          history: messages.slice(-24),
          context: { ...sessionToAskContext(session), phase: "debrief" },
        },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const final: KeptChatMessage[] = [
        ...messages,
        { role: "assistant", content: content || "(no answer)" },
      ];
      setMessages(final);
      saveLocalMessages(final);
      await saveSessionMessages(session.id, final);
      setSession({ ...session, messages: final });
    } catch (e) {
      console.error("[AcademyAsk - endRoleplay]:", e);
      setError(e instanceof Error ? e.message : COPY.academy.askErrorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function ensureFreeSession(userId: string): Promise<CoachSession | null> {
    if (session) return session;
    const legacy = legacyContext.current;
    const { session: created, error: createError } = await createSession(userId, {
      mode: "free",
      title: legacy.topic || "Free coach chat",
      source: legacy.source ?? "hub",
      slug: legacy.slug,
      situation: "",
      messages: [],
    });
    if (!created) {
      setError(createError || COPY.academy.askErrorGeneric);
      return null;
    }
    setSession(created);
    loadedSessionId.current = created.id;
    void nav({
      to: "/academy/ask",
      search: { session: created.id },
      replace: true,
    });
    return created;
  }

  async function send() {
    const q = input.trim();
    if (!q || busy || !user) return;
    setError(null);
    setInput("");
    setBusy(true);

    const active = await ensureFreeSession(user.id);
    if (!active) {
      setBusy(false);
      return;
    }

    const next: KeptChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    saveLocalMessages(next);
    await saveSessionMessages(active.id, next);

    try {
      const context = sessionToAskContext(active);
      const { data, error: err } = await supabase.functions.invoke("sales-ask", {
        body: {
          question: q,
          history: messages.slice(-12),
          context,
        },
      });
      if (err) throw err;
      const content = (data as { content?: string })?.content ?? "";
      const final: KeptChatMessage[] = [
        ...next,
        { role: "assistant", content: content || "(no answer)" },
      ];
      setMessages(final);
      saveLocalMessages(final);
      await saveSessionMessages(active.id, final);
      setSession({ ...active, messages: final });
    } catch (e) {
      const msg = e instanceof Error ? e.message : COPY.academy.askErrorGeneric;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function startNew() {
    if (busy || !user) return;
    setBusy(true);
    setError(null);
    const { session: created, error: createError } = await createSession(user.id, {
      mode: "free",
      title: "Free coach chat",
      source: "hub",
      messages: [],
    });
    setBusy(false);
    if (!created) {
      setError(createError || COPY.academy.askErrorGeneric);
      return;
    }
    loadedSessionId.current = created.id;
    setSession(created);
    setMessages([]);
    saveLocalMessages([]);
    setInput("");
    void nav({
      to: "/academy/ask",
      search: { session: created.id },
      replace: true,
    });
  }

  if (loading || !user || loadingSession) return <AcademyAuthSkeleton />;

  const banner =
    session &&
    (session.deal_name ||
      session.stage ||
      session.has_champion ||
      session.mode !== "free" ||
      (session.slug && session.title))
      ? COPY.academy.askSessionBanner(sessionBannerLabel(session))
      : search.topic
        ? COPY.academy.askContextBanner(search.topic)
        : undefined;

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-4xl flex-col px-4 py-4 pb-24 sm:px-6 lg:pb-4">
      <Link
        to="/academy"
        className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {COPY.academy.backToHub}
      </Link>

      {recent.length > 0 && messages.length === 0 ? (
        <div className="mt-2 shrink-0">
          <p className="page-eyebrow mb-2">{COPY.academy.askResumeTitle}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                to="/academy/ask"
                search={{ session: s.id }}
                className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-surface-2"
                onClick={() => {
                  loadedSessionId.current = null;
                }}
              >
                {sessionBannerLabel(s).slice(0, 42)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {session?.mode === "roleplay" && messages.length >= 2 ? (
        <div className="mt-2 shrink-0">
          <button
            type="button"
            onClick={() => void endRoleplay()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 bg-accent px-4 text-sm font-semibold text-foreground transition hover:bg-accent/70 disabled:opacity-50"
          >
            <Flag className="h-4 w-4 text-primary" aria-hidden />
            {COPY.academy.roleplayEndCta}
          </button>
        </div>
      ) : null}

      <div className="mt-2 min-h-0 flex-1">
        <KeptAiChat
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={() => void send()}
          onNewChat={() => void startNew()}
          busy={busy}
          error={error}
          contextTopic={banner}
          scrollRef={scrollRef}
          emptyActions
        />
      </div>
    </div>
  );
}
