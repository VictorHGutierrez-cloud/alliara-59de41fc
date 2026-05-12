import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface Stat {
  icon: React.ReactNode;
  label: string;
}

type BaseAnimatedHikeCardProps = {
  title: string;
  stats: Stat[];
  description: string;
  className?: string;
  /** Smaller title for dense grids (e.g. landing axis cards). */
  compactTitle?: boolean;
  /** Remote images for the stacked hover strip. */
  images?: string[];
  /** When set (and `images` is empty), draws three gradient panels using this CSS color, e.g. `var(--octa-1)`. */
  accentCssVar?: string;
};

export type AnimatedHikeCardProps = BaseAnimatedHikeCardProps &
  ({ href: string; axisKey?: undefined } | { axisKey: string; href?: undefined });

const stackItemStyle = (index: number, total: number): React.CSSProperties => ({
  transform: `translateX(${index * 32}px)`,
  ["--tx" as string]: `${index * 80}px`,
  ["--r" as string]: `${index * 5 - 5}deg`,
  zIndex: total - index,
});

export const AnimatedHikeCard = React.forwardRef<HTMLAnchorElement, AnimatedHikeCardProps>(
  (
    {
      title,
      images = [],
      stats,
      description,
      className,
      compactTitle,
      accentCssVar,
      axisKey,
      href,
    },
    ref,
  ) => {
    const useColorStack = Boolean(accentCssVar) && images.length === 0;
    const stackCount = useColorStack ? 3 : images.length;

    const cardClass = cn(
      "group relative block w-full max-w-sm cursor-pointer rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:hover:translate-y-0 lg:max-w-md",
      className,
    );

    const titleClass = cn(
      "font-bold tracking-tighter text-balance",
      compactTitle ? "text-lg leading-snug sm:text-xl" : "text-3xl",
    );

    const stack = (
      <div className="relative mb-6 h-32">
        {useColorStack
          ? [0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden
                className={cn(
                  "absolute h-full w-[40%] overflow-hidden rounded-lg border-2 border-background shadow-md transition-all duration-300 ease-in-out motion-reduce:transition-none",
                  "group-hover:translate-x-[var(--tx)] group-hover:rotate-[var(--r)] motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:rotate-0",
                )}
                style={{
                  ...stackItemStyle(index, 3),
                  background: `linear-gradient(145deg, color-mix(in oklab, ${accentCssVar} ${86 - index * 14}%, white), color-mix(in oklab, ${accentCssVar} 38%, #0f172a 62%))`,
                }}
              />
            ))
          : images.map((src, index) => (
              <div
                key={src}
                className={cn(
                  "absolute h-full w-[40%] overflow-hidden rounded-lg border-2 border-background shadow-md transition-all duration-300 ease-in-out motion-reduce:transition-none",
                  "group-hover:translate-x-[var(--tx)] group-hover:rotate-[var(--r)] motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:rotate-0",
                )}
                style={stackItemStyle(index, images.length)}
              >
                <img
                  src={src}
                  alt={`${title} preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
      </div>
    );

    const body = (
      <div className="flex flex-col">
        <div className="mb-6 flex items-start justify-between gap-3">
          <h2 className={titleClass}>{title}</h2>
          <ArrowRight
            className="mt-1 h-6 w-6 shrink-0 transition-transform duration-300 ease-in-out group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
            aria-hidden
          />
        </div>

        {stackCount > 0 ? stack : null}

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-1.5">
              {stat.icon}
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    );

    const label = `Learn more about ${title}`;

    if (axisKey) {
      return (
        <Link
          ref={ref}
          to="/axis/$axisKey"
          params={{ axisKey }}
          className={cardClass}
          aria-label={label}
        >
          {body}
        </Link>
      );
    }

    return (
      <a ref={ref} href={href} className={cardClass} aria-label={label}>
        {body}
      </a>
    );
  },
);

AnimatedHikeCard.displayName = "AnimatedHikeCard";
