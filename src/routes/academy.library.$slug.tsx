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
import { saveLastStudy, isMaterialCompleted, toggleMaterialCompleted } from "@/lib/academy-progress";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [completed, setCompleted] = useState(() => isMaterialCompleted(slug));

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
      return;
    }
    let cancelled = false;
    void fetch(salesMaterialUrl(material))
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setMdText(t);
      })
      .catch(() => {
        if (!cancelled) setMdText(COPY.academy.readerLoadError);
      });
    return () => {
      cancelled = true;
    };
  }, [material]);

  if (loading || !user) return null;

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

  const assetUrl = salesMaterialUrl(material);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/academy/library"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {COPY.academy.backToLibrary}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox
              checked={completed}
              onCheckedChange={() => {
                const next = toggleMaterialCompleted(slug);
                setCompleted(next);
              }}
            />
            {completed ? COPY.academy.markIncomplete : COPY.academy.markComplete}
          </label>
          <a
            href={assetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-surface-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {COPY.academy.openNewTab}
          </a>
          <Link
            to="/academy/ask"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            {COPY.academy.askAboutThis}
          </Link>
        </div>
      </div>

      <header className="mt-4 border-b border-border/60 pb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
          {SALES_MATERIAL_CATEGORIES[material.category].label}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{material.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{material.summary}</p>
      </header>

      {material.kind === "html" ? (
        <iframe
          title={material.title}
          src={assetUrl}
          className="mt-4 h-[min(78vh,900px)] w-full rounded-2xl border border-border bg-card"
        />
      ) : (
        <article className="mt-4 rounded-2xl border border-border bg-card p-6 overflow-auto max-h-[78vh]">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
            {mdText ?? COPY.academy.readerLoading}
          </pre>
        </article>
      )}
    </div>
  );
}
