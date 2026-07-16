import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { LMS_TRACKS, SALES_LIBRARY } from "@/content/sales-library";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { loadLastStudy } from "@/lib/academy-progress";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: COPY.academy.pageMetaTitle },
      { name: "description", content: COPY.academy.pageMetaDescription },
    ],
  }),
  component: AcademyLayout,
});

function AcademyLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = path === "/academy" || path === "/academy/";

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return null;

  if (!isIndex) return <Outlet />;

  return <AcademyHomePage />;
}

function AcademyHomePage() {
  const trackAvailable = LMS_TRACKS.filter((t) => t.status === "available").length;
  const [lastStudy, setLastStudy] = useState(() => loadLastStudy());

  useEffect(() => {
    setLastStudy(loadLastStudy());
  }, []);

  const resumeTo =
    lastStudy?.type === "material"
      ? { to: "/academy/library/$slug" as const, params: { slug: lastStudy.slug } }
      : { to: "/academy/learn" as const };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="page-eyebrow">
              {COPY.academy.eyebrow}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{COPY.academy.pageTitle}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{COPY.academy.intro}</p>
        </div>
        <KeptIllustration variant="keepsContext" className="h-[110px] w-auto opacity-95" decorative />
      </section>

      {lastStudy ? (
        <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="text-sm font-semibold">{COPY.academy.continueTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.academy.continueBody}</p>
          <p className="mt-2 text-base font-medium">{lastStudy.title}</p>
          <Link
            to={resumeTo.to}
            {...("params" in resumeTo ? { params: resumeTo.params } : {})}
            className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {COPY.academy.continueCta}
          </Link>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/40 p-5">
          <p className="text-sm text-muted-foreground">{COPY.academy.continueEmpty}</p>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <HubCard
          icon={BookOpen}
          title={COPY.academy.libraryCardTitle}
          body={COPY.academy.libraryCardBody}
          meta={`${SALES_LIBRARY.length} resources`}
          to="/academy/library"
        />
        <HubCard
          icon={MessageCircleQuestion}
          title={COPY.academy.askCardTitle}
          body={COPY.academy.askCardBody}
          meta={COPY.academy.askCardMeta}
          to="/academy/ask"
        />
        <HubCard
          icon={GraduationCap}
          title={COPY.academy.learnCardTitle}
          body={COPY.academy.learnCardBody}
          meta={`${trackAvailable} tracks live`}
          to="/academy/learn"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{COPY.academy.situationTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{COPY.academy.situationBody}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/academy/ask"
            className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {COPY.academy.situationCta}
          </Link>
          <Link
            to="/academy/library"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2"
          >
            {COPY.academy.browseLibraryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}

function HubCard({
  icon: Icon,
  title,
  body,
  meta,
  to,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
  meta: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/60 bg-card p-5 card-elev hover:-translate-y-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <p className="mt-4 page-eyebrow text-muted-foreground group-hover:text-primary transition">
        {meta} →
      </p>
    </Link>
  );
}
