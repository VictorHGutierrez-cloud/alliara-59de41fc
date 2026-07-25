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
      ? "border-border bg-surface-2"
      : tone === "neutral"
        ? "border-border bg-background"
        : "border-border bg-surface-2";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        toneClass,
        className,
      )}
    >
      <div className="relative flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground">
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
              : "inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity";

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
