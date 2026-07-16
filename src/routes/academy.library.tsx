import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import {
  SALES_LIBRARY,
  SALES_MATERIAL_CATEGORIES,
  type SalesMaterialCategory,
} from "@/content/sales-library";

export const Route = createFileRoute("/academy/library")({
  head: () => ({ meta: [{ title: COPY.academy.libraryMetaTitle }] }),
  component: AcademyLibraryLayout,
});

function AcademyLibraryLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = path === "/academy/library" || path === "/academy/library/";

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return null;

  if (!isIndex) return <Outlet />;

  return <AcademyLibraryPage />;
}

function AcademyLibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SalesMaterialCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SALES_LIBRARY.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      const hay = [m.title, m.summary, ...m.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      <Link
        to="/academy"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {COPY.academy.backToHub}
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">{COPY.academy.libraryTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{COPY.academy.libraryIntro}</p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={COPY.academy.librarySearchPlaceholder}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="All" />
          {(Object.keys(SALES_MATERIAL_CATEGORIES) as SalesMaterialCategory[]).map((key) => (
            <FilterChip
              key={key}
              active={category === key}
              onClick={() => setCategory(key)}
              label={SALES_MATERIAL_CATEGORIES[key].label}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Link
            key={m.slug}
            to="/academy/library/$slug"
            params={{ slug: m.slug }}
            className="rounded-2xl border border-border/60 bg-card p-5 card-elev hover:-translate-y-0.5 transition"
          >
            <p className="page-eyebrow text-primary">
              {SALES_MATERIAL_CATEGORIES[m.category].label}
            </p>
            <h2 className="mt-2 text-base font-semibold leading-snug">{m.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {m.durationMin ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {m.durationMin} min
                </span>
              ) : null}
              {m.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">{COPY.academy.libraryEmpty}</p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-2"
      }
    >
      {label}
    </button>
  );
}
