import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef, type CSSProperties, type ReactNode } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
            className="inline-block mr-[0.25em] last:mr-0"
          >
            {word}
            {showAsterisk && isLast && <span className="ml-1 align-super text-[0.55em] opacity-70">*</span>}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
          className={`inline-block mr-[0.25em] last:mr-0 ${w.className ?? ""}`}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- PrismaHero ---------------- */
interface PrismaHeroProps {
  videoSrc?: string;
  eyebrow?: string;
  headlineSegments?: Segment[];
  description?: string;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
}

const PRISMA_KEYFRAMES = `
@keyframes prisma-spin {
  0%   { transform: rotate(0deg)   scale(1.4); }
  100% { transform: rotate(360deg) scale(1.4); }
}
@keyframes prisma-drift {
  0%, 100% { transform: translate3d(0,0,0); }
  50%      { transform: translate3d(-3%, 2%, 0); }
}
`;

const NOISE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>";

export const PrismaHero = ({
  videoSrc,
  eyebrow = "for Factorial PDMs",
  headlineSegments,
  description = "One operating system to diagnose, plan, and grow each partnership across 8 axes.",
  primaryCta,
  secondaryCta,
}: PrismaHeroProps) => {
  const segments: Segment[] =
    headlineSegments ?? [
      { text: "Orchestrate every partner", className: "text-foreground" },
      { text: "like it's your only one.", className: "text-primary" },
    ];

  return (
    <section className="relative w-full h-[calc(100vh-3.5rem)] -mt-14 pt-14 overflow-hidden bg-black">
      <style dangerouslySetInnerHTML={{ __html: PRISMA_KEYFRAMES }} />

      {/* Layer 1 — Background video (full-bleed) */}
      {videoSrc ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, var(--octa-1), var(--octa-2), var(--octa-3), var(--octa-4), var(--octa-5), var(--octa-6), var(--octa-7), var(--octa-8), var(--octa-1))",
              filter: "blur(80px) saturate(140%)",
              animation: "prisma-spin 40s linear infinite",
              opacity: 0.55,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 30% 70%, color-mix(in oklab, var(--octa-4) 40%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, color-mix(in oklab, var(--octa-2) 40%, transparent), transparent 60%)",
              animation: "prisma-drift 18s ease-in-out infinite",
            }}
          />
        </>
      )}

      {/* Layer 2 — Noise texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.12]"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />

      {/* Layer 3 — Dark vignette to keep text readable on the video */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 h-full flex items-center px-6 sm:px-10">
        <div className="mx-auto max-w-6xl w-full animate-fade-in">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="font-mono uppercase tracking-[0.18em]">{eyebrow}</span>
            </div>

            <h1 className="mt-7 font-display font-semibold tracking-[-0.025em] text-[44px] leading-[1.05] sm:text-[64px] sm:leading-[1.02] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
              <WordsPullUpMultiStyle segments={segments} />
            </h1>

            <p className="mt-6 max-w-md text-[17px] leading-[1.55] text-white/85">{description}</p>

            {(primaryCta || secondaryCta) && (
              <div className="mt-9 flex flex-col items-start gap-4">
                {primaryCta}
                {secondaryCta}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PrismaHeroArrow = ArrowRight;