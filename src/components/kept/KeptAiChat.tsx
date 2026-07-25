import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Send } from "lucide-react";
import { CanvasRevealEffect } from "@/components/ui/canvas-effect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownProse } from "@/components/ui/markdown-prose";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type KeptChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type KeptAiChatProps = {
  messages: KeptChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  busy?: boolean;
  error?: string | null;
  contextTopic?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

function ThinkingSkeleton() {
  return (
    <div
      className="mr-4 space-y-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-[var(--shadow-card)]"
      aria-live="polite"
    >
      <p className="text-xs font-medium text-muted-foreground">{COPY.academy.askThinking}</p>
      <Skeleton className="h-3 w-[88%] rounded-full" />
      <Skeleton className="h-3 w-[72%] rounded-full" />
      <Skeleton className="h-3 w-[56%] rounded-full" />
    </div>
  );
}

function GradientWord({ content, variant }: { content: string; variant: 1 | 2 | 3 }) {
  return (
    <span
      data-content={`${content}.`}
      className={cn(
        "relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0",
        variant === 1 && "before:animate-kept-gradient-bg-1",
        variant === 2 && "before:animate-kept-gradient-bg-2",
        variant === 3 && "before:animate-kept-gradient-bg-3",
      )}
    >
      <span
        className={cn(
          "bg-gradient-to-r bg-clip-text px-2 text-transparent",
          variant === 1 && "from-kept-gradient-1-start to-kept-gradient-1-end animate-kept-gradient-fg-1",
          variant === 2 && "from-kept-gradient-2-start to-kept-gradient-2-end animate-kept-gradient-fg-2",
          variant === 3 && "from-kept-gradient-3-start to-kept-gradient-3-end animate-kept-gradient-fg-3",
        )}
      >
        {content}.
      </span>
    </span>
  );
}

export function KeptAiChat({
  messages,
  input,
  onInputChange,
  onSend,
  onNewChat,
  busy = false,
  error = null,
  contextTopic,
  scrollRef,
}: KeptAiChatProps) {
  const [hovered, setHovered] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setCanvasReady(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!busy && input.trim()) onSend();
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      <div className="relative flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <AnimatePresence>
          {hovered && canvasReady && !reduceMotion ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0"
            >
              <CanvasRevealEffect
                animationSpeed={5}
                containerClassName="bg-transparent opacity-20"
                colors={[
                  [23, 23, 23],
                  [115, 115, 115],
                ]}
                opacities={[1, 0.8, 1, 0.8, 0.5, 0.8, 1, 0.5, 1, 1]}
                dotSize={2}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="relative z-20 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-2 text-center">
            <h1 className="flex select-none flex-wrap items-center justify-center gap-x-1 py-2 text-center text-2xl font-extrabold leading-none tracking-tight sm:text-3xl lg:text-4xl">
              <GradientWord content="Deal" variant={1} />
              <GradientWord content="Coach" variant={2} />
              <GradientWord content="Now" variant={3} />
            </h1>
            <p className="mx-auto mt-1 max-w-md text-center text-xs text-muted-foreground sm:text-sm">
              {COPY.academy.askSubtitle}
            </p>
          </div>

          {contextTopic ? (
            <p className="mx-2 mt-3 shrink-0 rounded-xl border border-border bg-surface-2 px-3 py-2 text-center text-xs font-medium text-foreground">
              {COPY.academy.askContextBanner(contextTopic)}
            </p>
          ) : null}

          <ScrollArea className="mt-4 min-h-0 flex-1">
            <div ref={scrollRef} className="h-[min(52vh,420px)] space-y-3 overflow-y-auto px-2 pb-2">
              {messages.length === 0 ? (
                <div className="space-y-4 py-6 text-center">
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                    {COPY.academy.askEmptyHint}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {COPY.academy.askSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onInputChange(s)}
                        className="min-h-11 max-w-xs rounded-xl border border-border bg-card/90 px-3.5 py-2.5 text-left text-xs font-medium leading-snug text-foreground shadow-[var(--shadow-card)] hover:bg-surface-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      m.role === "user"
                        ? "ml-8 rounded-2xl rounded-tr-sm bg-surface-2 px-4 py-3 text-[15px] font-medium leading-relaxed text-foreground"
                        : "mr-4 rounded-2xl rounded-tl-sm border border-border/60 bg-card/95 px-4 py-3 shadow-[var(--shadow-card)]",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownProse content={m.content} variant="chat" />
                    ) : (
                      m.content
                    )}
                  </div>
                ))
              )}
              {busy ? <ThinkingSkeleton /> : null}
            </div>
          </ScrollArea>

          {error ? <p className="mt-2 px-2 text-xs text-destructive">{error}</p> : null}

          <div className="relative mt-3 w-full shrink-0">
            <form onSubmit={handleSubmit}>
              <Input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={COPY.academy.askPlaceholder}
                disabled={busy}
                className="h-11 rounded-xl border-border/80 bg-background/90 pl-12 pr-12 text-[15px] shadow-sm"
                aria-label={COPY.academy.askPlaceholder}
              />
            </form>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={busy}
              onClick={onNewChat}
              className="absolute left-1.5 top-1.5 h-8 w-8 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">{COPY.academy.askNewChat}</span>
            </Button>

            <Button
              type="button"
              size="icon"
              disabled={busy || !input.trim()}
              onClick={onSend}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg"
              aria-label={COPY.academy.askSendAria}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
