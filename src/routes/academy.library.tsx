import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import {
  SALES_MATERIAL_CATEGORIES,
  libraryMaterials,
  type SalesMaterialCategory,
} from "@/content/sales-library";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import { ContentResourceCard } from "@/components/ui/content-resource-card";
import { SearchField } from "@/components/ui/search-field";

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

  if (loading || !user) return <AcademyAuthSkeleton />;

  if (!isIndex) return <Outlet />;

  return <AcademyLibraryPage />;
}

function AcademyLibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SalesMaterialCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryMaterials().filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      const hay = [m.title, m.summary, ...m.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <AcademyPageShell
      backToAcademy
      title={COPY.academy.libraryTitle}
      subtitle={COPY.academy.libraryIntro}
    >
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={COPY.academy.librarySearchPlaceholder}
          aria-label={COPY.academy.librarySearchPlaceholder}
        />
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
          <ContentResourceCard
            key={m.slug}
            to="/academy/library/$slug"
            params={{ slug: m.slug }}
            categoryLabel={SALES_MATERIAL_CATEGORIES[m.category].label}
            title={m.title}
            summary={m.summary}
            durationMin={m.durationMin}
            tags={m.tags}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">{COPY.academy.libraryEmpty}</p>
      )}
    </AcademyPageShell>
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
          ? "min-h-11 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          : "min-h-11 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-surface-2"
      }
    >
      {label}
    </button>
  );
}
