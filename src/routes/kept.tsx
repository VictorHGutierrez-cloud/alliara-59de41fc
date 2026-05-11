import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePortfolio, tierColor } from "@/lib/partners-store";
import { COPY } from "@/lib/copy";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/kept")({
  head: () => ({ meta: [{ title: COPY.kept.hubMetaTitle }] }),
  component: KeptHubPage,
});

function KeptHubPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const portfolio = usePortfolio(user?.id);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      void nav({ to: "/login" });
    }
  }, [authLoading, user, nav]);

  const filtered = useMemo(() => {
    const list = portfolio.items;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => {
      const name = it.partner.name.toLowerCase();
      const company = (it.partner.company ?? "").toLowerCase();
      return name.includes(q) || company.includes(q);
    });
  }, [portfolio.items, query]);

  if (authLoading || !user) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (portfolio.loading) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (portfolio.error) {
    return (
      <div className="page-shell">
        <p className="text-sm text-destructive">{portfolio.error}</p>
        <button
          type="button"
          className="mt-4 btn-candy min-h-11 px-6"
          onClick={() => void portfolio.retry()}
        >
          {COPY.portfolio.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <Link
        to="/partners"
        className="text-xs font-mono text-muted-foreground hover:text-foreground min-h-11 inline-flex items-center"
      >
        {COPY.kept.hubBackToPortfolio}
      </Link>

      <div>
        <h1 className="page-title">{COPY.kept.hubTitle}</h1>
        <p className="page-subtitle mt-1 max-w-prose">{COPY.kept.hubIntro}</p>
      </div>

      <label className="block">
        <span className="sr-only">{COPY.kept.hubSearchPlaceholder}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={COPY.kept.hubSearchPlaceholder}
          className="input w-full min-h-11"
          autoComplete="off"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{COPY.kept.hubEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((it) => {
            const tc = tierColor(it.partner.tier);
            const pid = it.partner.id;
            return (
              <li key={pid}>
                <Link
                  to="/partner/$partnerId/coach"
                  params={{ partnerId: pid }}
                  search={{ autorun: undefined }}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:bg-surface/80"
                >
                  <span className="min-w-0 font-medium text-foreground truncate">{it.partner.name}</span>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: `color-mix(in oklab, var(--${tc}) 22%, transparent)`,
                      color: `var(--${tc})`,
                    }}
                  >
                    {COPY.kept.hubOpenCoachCta}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
