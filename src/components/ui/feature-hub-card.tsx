import { Link } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureHubCardProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  meta?: string;
  className?: string;
} & (
  | { to: string; params?: Record<string, string> }
  | { as?: "div" }
);

export function FeatureHubCard(props: FeatureHubCardProps) {
  const { icon: Icon, title, body, meta, className } = props;

  const inner = (
    <>
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
      <h3 className="relative mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      {meta ? (
        <p className="relative mt-4 page-eyebrow text-muted-foreground transition-colors group-hover:text-foreground">
          {meta}
        </p>
      ) : null}
    </>
  );

  const shellClass = cn(
    "group relative overflow-hidden rounded-2xl bg-card p-5 min-h-[11rem]",
    "border border-border/60 card-elev",
    "transition-all duration-300 hover:-translate-y-0.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  if ("to" in props) {
    return (
      <Link to={props.to} params={props.params} className={shellClass}>
        {inner}
      </Link>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
