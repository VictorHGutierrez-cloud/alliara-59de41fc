import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

export function AcademyPageShell({
  eyebrow,
  title,
  subtitle,
  backToAcademy = false,
  illustration,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backToAcademy?: boolean;
  illustration?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 py-8 pb-32", className)}>
      {backToAcademy ? (
        <Link
          to="/academy"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {COPY.academy.backToHub}
        </Link>
      ) : null}
      <header className={cn("flex items-start justify-between gap-4", backToAcademy && "mt-4")}>
        <div className="min-w-0">
          {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
        {illustration ? <div className="hidden shrink-0 sm:block">{illustration}</div> : null}
      </header>
      {children}
    </div>
  );
}
