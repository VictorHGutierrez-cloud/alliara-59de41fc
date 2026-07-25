import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import keptMark from "@/assets/kept-mark.png?url";
import keptLogo from "@/assets/kept-logo.png?url";

type BrandLogoVariant = "header" | "sidebar" | "sidebarCollapsed" | "auth" | "intro";

const SIZES: Record<BrandLogoVariant, { src: "mark" | "wordmark"; className: string }> = {
  header: {
    src: "wordmark",
    className: "h-8 w-auto max-w-[9.5rem] sm:h-9",
  },
  sidebar: {
    src: "wordmark",
    className: "h-8 w-auto max-w-[9rem] object-left",
  },
  sidebarCollapsed: {
    src: "mark",
    className: "size-8",
  },
  auth: {
    src: "wordmark",
    className: "h-8 w-auto max-w-[8.5rem]",
  },
  intro: {
    src: "wordmark",
    className: "h-9 w-auto max-w-[10rem]",
  },
};

export function BrandLogo({
  variant = "header",
  to = "/",
  className,
  onClick,
}: {
  variant?: BrandLogoVariant;
  to?: string;
  className?: string;
  onClick?: () => void;
}) {
  const cfg = SIZES[variant];
  const src = cfg.src === "mark" ? keptMark : keptLogo;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={COPY.auth.logoAltWordmark}
    >
      <img
        src={src}
        alt={COPY.auth.logoAltWordmark}
        className={cn("object-contain", cfg.className)}
        decoding="async"
      />
    </Link>
  );
}
