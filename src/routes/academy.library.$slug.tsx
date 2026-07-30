import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, MessageCircleQuestion } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import {
  getSalesMaterial,
  salesMaterialUrl,
  SALES_MATERIAL_CATEGORIES,
} from "@/content/sales-library";
import { saveLastStudy, isMaterialCompleted, completeMaterial, pushAcademyProgress } from "@/lib/academy-progress";
import { useCompletionCelebration } from "@/hooks/use-completion-celebration";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownProse } from "@/components/ui/markdown-prose";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/academy/library/$slug")({
  head: ({ params }) => {
    const m = getSalesMaterial(params.slug);
    return { meta: [{ title: m ? `${m.title} · Academy` : "Resource · Academy" }] };
  },
  component: AcademyLibraryReaderPage,
});

function AcademyLibraryReaderPage() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const material = getSalesMaterial(slug);
  const [mdText, setMdText] = useState<string | null>(null);
  const [mdLoading, setMdLoading] = useState(false);
  const [completed, setCompleted] = useState(() => isMaterialCompleted(slug));
  const { celebrate, celebration } = useCompletionCelebration();

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (material) {
      saveLastStudy({ type: "material", slug: material.slug, title: material.title });
    }
  }, [material]);

  useEffect(() => {
    if (!material || material.kind !== "markdown") {
      setMdText(null);
      setMdLoading(false);
      return;
    }
    let cancelled = false;
    setMdLoading(true);
    void fetch(salesMaterialUrl(material))
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setMdText(t);
      })
      .catch(() => {
        if (!cancelled) setMdText(COPY.academy.readerLoadError);
      })
      .finally(() => {
        if (!cancelled) setMdLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [material]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  if (!material) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-muted-foreground">{COPY.academy.readerNotFound}</p>
        <Link to="/academy/library" className="mt-4 inline-block text-sm text-primary hover:underline">
          {COPY.academy.backToLibrary}
        </Link>
      </div>
    );
  }

  const isHtml = material.kind === "html";
  const assetUrl = salesMaterialUrl(material, { embed: isHtml });

  return (
    <div
      className={cn(
        "flex flex-col",
        isHtml
          ? "h-[calc(100dvh-5rem)] w-full"
          : "mx-auto max-w-7xl px-6 py-6 pb-24",
      )}
    >
      {celebration}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 shrink-0",
          isHtml
            ? "border-b border-border/60 bg-card/90 px-3 py-2 sm:px-4 backdrop-blur-sm"
            : "gap-3",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/academy/library"
            className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            {COPY.academy.backToLibrary}
          </Link>
          {isHtml ? (
            <div className="min-w-0 hidden sm:block">
              <p className="page-eyebrow text-primary truncate">
                {SALES_MATERIAL_CATEGORIES[material.category].label}
              </p>
              <h1 className="truncate text-sm font-semibold tracking-tight">{material.title}</h1>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="inline-flex min-h-10 items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              checked={completed}
              onCheckedChange={() => {
                const { completed: next, justCompleted } = completeMaterial(slug);
                setCompleted(next);
                if (justCompleted) celebrate();
                if (user) void pushAcademyProgress(user.id);
              }}
            />
            {completed ? COPY.academy.markIncomplete : COPY.academy.markComplete}
          </label>
          <a
            href={assetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-surface-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{COPY.academy.openNewTab}</span>
          </a>
          <Link
            to="/academy/ask"
            search={{
              topic: material.title,
              slug: material.slug,
              source: "library",
              draft: COPY.academy.askContextDraft(material.title),
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{COPY.academy.askAboutThis}</span>
          </Link>
        </div>
      </div>

      {!isHtml ? (
        <header className="mt-4 border-b border-border/60 pb-4">
          <p className="page-eyebrow text-primary">{SALES_MATERIAL_CATEGORIES[material.category].label}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{material.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{material.summary}</p>
        </header>
      ) : null}

      {isHtml ? (
        <iframe
          title={material.title}
          src={assetUrl}
          className="min-h-0 w-full flex-1 border-0 bg-card"
        />
      ) : material.kind === "video" ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <video
            key={assetUrl}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-foreground/95"
            aria-label={material.title}
          >
            <source src={assetUrl} type="video/mp4" />
          </video>
        </div>
      ) : (
        <article className="mt-4 rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-auto max-h-[78vh] shadow-[var(--shadow-card)]">
          {mdLoading || mdText === null ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <MarkdownProse content={mdText} variant="article" />
          )}
        </article>
      )}
    </div>
  );
}
