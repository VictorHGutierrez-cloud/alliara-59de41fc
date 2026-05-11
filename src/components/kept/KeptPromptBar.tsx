import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type KeptPromptVariant = "chatgpt" | "animated" | "minimal";

export interface KeptPromptAxisOption {
  key: string;
  name: string;
}

export interface KeptPromptBarLabels {
  overallOption: string;
  focusPrefix: string;
  contextLabel: string;
  contextPlaceholder: string;
  toggleContextShow: string;
  toggleContextHide: string;
  generate: string;
  regenerate: string;
  busy: string;
}

export interface KeptPromptBarProps {
  /** When omitted, uses {@link resolveKeptPromptVariant} (site default `chatgpt`; env may set only `minimal` or `animated`). */
  variant?: KeptPromptVariant;
  focus: string;
  onFocusChange: (value: string) => void;
  context: string;
  onContextChange: (value: string) => void;
  onGenerate: () => void;
  busy: boolean;
  hasDiagnostic: boolean;
  isOwner: boolean;
  axes: readonly KeptPromptAxisOption[];
  labels: KeptPromptBarLabels;
  hasExistingRecs: boolean;
}

/**
 * Site default: `chatgpt`. Only `minimal` or `animated` are read from `VITE_KEPT_PROMPT_VARIANT`;
 * `chatgpt` and any other value fall back to `chatgpt` so production stays on the card prompt style unless devs opt in.
 */
export function resolveKeptPromptVariant(): KeptPromptVariant {
  const v = import.meta.env.VITE_KEPT_PROMPT_VARIANT as string | undefined;
  if (v === "minimal" || v === "animated") return v;
  return "chatgpt";
}

function FocusSelect({
  id,
  value,
  onChange,
  axes,
  overallOption,
  focusPrefix,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  axes: readonly KeptPromptAxisOption[];
  overallOption: string;
  focusPrefix: string;
  className?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("input w-auto min-w-[10rem]", className)}>
      <option value="">{overallOption}</option>
      {axes.map((a) => (
        <option key={a.key} value={a.key}>
          {focusPrefix} {a.name}
        </option>
      ))}
    </select>
  );
}

export function KeptPromptBar({
  variant: variantProp,
  focus,
  onFocusChange,
  context,
  onContextChange,
  onGenerate,
  busy,
  hasDiagnostic,
  isOwner,
  axes,
  labels,
  hasExistingRecs,
}: KeptPromptBarProps) {
  const variant = variantProp ?? resolveKeptPromptVariant();
  const focusId = useId();
  const contextId = useId();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [minimalContextOpen, setMinimalContextOpen] = useState(false);

  if (!isOwner) return null;

  const ctaLabel = busy ? labels.busy : hasExistingRecs ? labels.regenerate : labels.generate;
  const ctaDisabled = busy || !hasDiagnostic;

  const contextField = (
    <div className="space-y-1.5 w-full min-w-0">
      <label htmlFor={contextId} className="text-xs text-muted-foreground font-medium sr-only sm:not-sr-only sm:block">
        {labels.contextLabel}
      </label>
      <Textarea
        id={contextId}
        value={context}
        onChange={(e) => onContextChange(e.target.value)}
        placeholder={labels.contextPlaceholder}
        disabled={busy || !hasDiagnostic}
        rows={variant === "minimal" ? 2 : 3}
        className={cn(
          "resize-y min-h-[52px] bg-background/80 text-sm",
          variant === "chatgpt" && "rounded-xl border-border/80 shadow-sm",
          variant === "animated" && "rounded-xl border-primary/20",
        )}
      />
    </div>
  );

  const generateButton = (className?: string, icon?: boolean) => (
    <button
      type="button"
      onClick={onGenerate}
      disabled={ctaDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40 shrink-0",
        className,
      )}
    >
      {icon && <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />}
      {ctaLabel}
    </button>
  );

  if (variant === "minimal") {
    return (
      <div className="flex w-full flex-col gap-3 sm:max-w-xl">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <FocusSelect
            id={focusId}
            value={focus}
            onChange={onFocusChange}
            axes={axes}
            overallOption={labels.overallOption}
            focusPrefix={labels.focusPrefix}
          />
          {generateButton()}
        </div>
        <button
          type="button"
          onClick={() => setMinimalContextOpen((o) => !o)}
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:justify-end"
        >
          {minimalContextOpen ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {labels.toggleContextHide}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {labels.toggleContextShow}
            </>
          )}
        </button>
        {minimalContextOpen ? contextField : null}
      </div>
    );
  }

  if (variant === "chatgpt") {
    return (
      <div className="flex w-full flex-col gap-3 rounded-2xl border border-border/70 bg-surface/50 p-4 sm:max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <FocusSelect
            id={focusId}
            value={focus}
            onChange={onFocusChange}
            axes={axes}
            overallOption={labels.overallOption}
            focusPrefix={labels.focusPrefix}
            className="flex-1 sm:flex-none"
          />
          {generateButton("max-sm:w-full", true)}
        </div>
        {contextField}
      </div>
    );
  }

  // animated
  const ringMotion = reduceMotion
    ? { rest: { boxShadow: "0 0 0 0px transparent" }, focus: { boxShadow: "0 0 0 0px transparent" } }
    : {
        rest: { boxShadow: "0 0 0 0px transparent" },
        focus: {
          boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 45%, transparent), 0 0 24px color-mix(in oklab, var(--primary) 18%, transparent)",
        },
      };

  const [boxState, setBoxState] = useState<"rest" | "focus">("rest");

  return (
    <div className="flex w-full flex-col gap-3 sm:max-w-2xl">
      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
        <FocusSelect
          id={focusId}
          value={focus}
          onChange={onFocusChange}
          axes={axes}
          overallOption={labels.overallOption}
          focusPrefix={labels.focusPrefix}
        />
        {generateButton()}
      </div>
      <motion.div
        initial="rest"
        animate={boxState}
        variants={ringMotion}
        transition={{ duration: 0.35, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="rounded-2xl border border-border/60 bg-surface/40 p-3"
      >
        <div className="space-y-2" onFocus={() => setBoxState("focus")} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setBoxState("rest")}>
          <label htmlFor={contextId} className="text-xs text-muted-foreground font-medium">
            {labels.contextLabel}
          </label>
          <Textarea
            id={contextId}
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder={labels.contextPlaceholder}
            disabled={busy || !hasDiagnostic}
            rows={4}
            className="resize-y min-h-[4.5rem] border-transparent bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </motion.div>
    </div>
  );
}
