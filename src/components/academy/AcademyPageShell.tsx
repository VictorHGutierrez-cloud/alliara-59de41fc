import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

export function AcademyPageShell({
  eyebrow,
  title,
  subtitle,
  backToAcademy = false,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backToAcademy?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 py-8 pb-32", className)}>
      {backToAcademy ? (
        <Link
          to="/academy"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {COPY.academy.backToHub}
        </Link>
      ) : null}
      <header className={backToAcademy ? "mt-4" : undefined}>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
