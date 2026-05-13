import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Stable landscape photos (Unsplash) — rotate by axis index when data has no imageUrl. */
export const INTERACTIVE_IMAGE_ACCORDION_DEFAULT_IMAGES: readonly string[] = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b75dffe770?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
] as const;

export interface InteractiveImageAccordionItem {
  id: string | number;
  title: string;
  imageUrl: string;
  /** Optional blurb shown when the strip is expanded. */
  description?: string;
  /** When set, shows an “Open guide” link to this axis. */
  axisKey?: string;
}

export type InteractiveImageAccordionCta =
  | { label: string; to: "/methodology" }
  | { label: string; to: "/axis/$axisKey"; params: { axisKey: string } };

export interface InteractiveImageAccordionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  intro?: string;
  items: InteractiveImageAccordionItem[];
  defaultActiveIndex?: number;
  cta?: InteractiveImageAccordionCta;
  className?: string;
  /** Optional extra classes for the accordion track (right column on large screens). */
  trackClassName?: string;
}

function pickImageForIndex(index: number, item: InteractiveImageAccordionItem): string {
  if (item.imageUrl) return item.imageUrl;
  const pool = INTERACTIVE_IMAGE_ACCORDION_DEFAULT_IMAGES;
  return pool[index % pool.length] ?? pool[0];
}

function handleImgError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const el = event.currentTarget;
  el.style.visibility = "hidden";
}

export function InteractiveImageAccordion({
  eyebrow,
  title,
  subtitle,
  intro,
  items,
  defaultActiveIndex = 0,
  cta,
  className,
  trackClassName,
}: InteractiveImageAccordionProps) {
  const safeDefault = Math.min(Math.max(defaultActiveIndex, 0), Math.max(items.length - 1, 0));
  const [activeIndex, setActiveIndex] = React.useState(safeDefault);

  React.useEffect(() => {
    setActiveIndex(Math.min(Math.max(defaultActiveIndex, 0), Math.max(items.length - 1, 0)));
  }, [defaultActiveIndex, items.length]);

  const move = React.useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      setActiveIndex((i) => {
        const next = (i + delta + items.length) % items.length;
        return next;
      });
    },
    [items.length],
  );

  const onKeyDownTrack = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(items.length - 1);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-12">
        <header className="max-w-lg">
          {eyebrow ? (
            <p className="page-eyebrow text-neutral-500" id="interactive-accordion-eyebrow">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 section-title text-3xl text-neutral-900 sm:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm font-medium text-neutral-700 sm:text-base">{subtitle}</p>
          ) : null}
          {intro ? (
            <p className="section-subtitle mt-3 text-neutral-600 leading-relaxed">{intro}</p>
          ) : null}
          {cta ? (
            <p className="mt-6">
              {cta.to === "/axis/$axisKey" ? (
                <Link
                  to="/axis/$axisKey"
                  params={cta.params}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {cta.label}
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <Link
                  to="/methodology"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {cta.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
            </p>
          ) : null}
        </header>

        {/* Mobile: featured card + picker */}
        <div className="lg:hidden space-y-4">
          <div
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            role="region"
            aria-roledescription="carousel"
            aria-label="Eight dimensions preview"
          >
            {(() => {
              const item = items[activeIndex];
              if (!item) return null;
              const src = pickImageForIndex(activeIndex, item);
              return (
                <article key={String(item.id)} className="relative">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={handleImgError}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <p className="text-xs font-mono uppercase tracking-[0.14em] text-white/80">
                        {activeIndex + 1} / {items.length}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 text-sm text-white/85 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      ) : null}
                      {item.axisKey ? (
                        <p className="mt-4">
                          <Link
                            to="/axis/$axisKey"
                            params={{ axisKey: item.axisKey }}
                            className="inline-flex min-h-11 items-center rounded-full bg-white/95 px-4 text-sm font-semibold text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            Open guide →
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })()}
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a dimension">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={String(item.id)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={cn(
                    "min-h-11 rounded-full border px-3.5 py-2 text-left text-xs font-medium transition-colors motion-reduce:transition-none",
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="sr-only">{item.title}</span>
                  <span aria-hidden className="tabular-nums">
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop / large: hover-expand accordion track */}
        <div
          className={cn("hidden lg:flex lg:h-[450px] lg:w-full lg:gap-2", trackClassName)}
          onKeyDown={onKeyDownTrack}
          role="group"
          aria-label="Eight dimensions — hover or use arrow keys to expand"
          tabIndex={0}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const src = pickImageForIndex(index, item);
            return (
              <AccordionStrip
                key={String(item.id)}
                item={item}
                index={index}
                total={items.length}
                imageSrc={src}
                isActive={isActive}
                onActivate={() => setActiveIndex(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AccordionStripProps {
  item: InteractiveImageAccordionItem;
  index: number;
  total: number;
  imageSrc: string;
  isActive: boolean;
  onActivate: () => void;
}

function AccordionStrip({
  item,
  index,
  total,
  imageSrc,
  isActive,
  onActivate,
}: AccordionStripProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm",
        "max-w-none transition-[flex,min-width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        isActive ? "min-w-[200px] flex-[4_1_0%]" : "min-w-[52px] max-w-[72px] flex-[0.35_1_0%]",
      )}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
    >
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={handleImgError}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 motion-reduce:transition-none",
            isActive ? "opacity-100" : "opacity-90",
          )}
          aria-hidden
        />
      </div>

      {/* Collapsed label (vertical) */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300 motion-reduce:transition-none",
          isActive ? "opacity-0" : "opacity-100",
        )}
        aria-hidden={isActive}
      >
        <span
          className="block max-h-[70%] overflow-hidden text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white [writing-mode:vertical-rl] rotate-180"
          title={item.title}
        >
          {item.title}
        </span>
      </div>

      {/* Expanded copy */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 transition-opacity duration-300 motion-reduce:transition-none sm:p-5",
          isActive ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/75">
          {index + 1} / {total}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-white sm:text-xl">
          {item.axisKey ? (
            <Link
              to="/axis/$axisKey"
              params={{ axisKey: item.axisKey }}
              className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        {item.description ? (
          <p className="mt-2 line-clamp-4 text-xs text-white/85 leading-relaxed sm:text-sm">
            {item.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
