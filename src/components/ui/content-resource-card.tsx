import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentResourceCardProps = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  categoryLabel: string;
  title: string;
  summary: string;
  durationMin?: number;
  tags?: string[];
  className?: string;
};

export function ContentResourceCard({
  to,
  params,
  search,
  categoryLabel,
  title,
  summary,
  durationMin,
  tags = [],
  className,
}: ContentResourceCardProps) {
  return (
    <Link
      to={to}
      params={params}
      search={search}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 card-elev",
        "transition-all duration-300 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative flex items-start justify-between gap-2">
        <p className="page-eyebrow text-muted-foreground">{categoryLabel}</p>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
      <h3 className="relative mt-2 text-base font-semibold leading-snug">{title}</h3>
      <p className="relative mt-2 flex-1 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {summary}
      </p>
      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {durationMin ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface/60 px-2 py-0.5">
            <Clock className="h-3 w-3" />
            {durationMin} min
          </span>
        ) : null}
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
