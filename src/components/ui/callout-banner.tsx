import { Link } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutAction = {
  label: string;
  onClick?: () => void;
  to?: string;
  params?: Record<string, string>;
  variant?: "primary" | "secondary";
};

type CalloutBannerProps = {
  title: string;
  body: string;
  icon?: LucideIcon;
  actions: CalloutAction[];
  tone?: "accent" | "primary" | "neutral";
  className?: string;
};

export function CalloutBanner({
  title,
  body,
  icon: Icon,
  actions,
  tone = "accent",
  className,
}: CalloutBannerProps) {
  const toneClass =
    tone === "primary"
      ? "border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card"
      : tone === "neutral"
        ? "border-border/70 bg-surface/50"
        : "border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        toneClass,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
      <div className="relative flex flex-wrap gap-2 shrink-0">
        {actions.map((action) => {
          const btnClass =
            action.variant === "secondary"
              ? "inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2 transition-colors"
              : "inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-ring transition-opacity";

          if (action.to) {
            return (
              <Link
                key={action.label}
                to={action.to}
                params={action.params}
                onClick={action.onClick}
                className={btnClass}
              >
                {action.label}
              </Link>
            );
          }

          return (
            <button key={action.label} type="button" onClick={action.onClick} className={btnClass}>
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
