import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import keptMark from "@/assets/kept-mark.png?url";
import keptLogo from "@/assets/kept-logo.png?url";

type BrandLogoVariant = "header" | "sidebar" | "sidebarCollapsed" | "auth" | "intro";

const SIZES: Record<BrandLogoVariant, { src: "mark" | "wordmark"; className: string }> = {
  header: {
    src: "wordmark",
    className: "h-16 w-auto max-w-[18rem] sm:h-[4.75rem] sm:max-w-[22rem]",
  },
  sidebar: {
    src: "wordmark",
    className: "h-14 w-auto max-w-[16rem] object-left",
  },
  sidebarCollapsed: {
    src: "mark",
    className: "size-12",
  },
  auth: {
    src: "wordmark",
    className: "h-16 w-auto max-w-[18rem]",
  },
  intro: {
    src: "wordmark",
    className: "h-[4.75rem] w-auto max-w-[22rem]",
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
