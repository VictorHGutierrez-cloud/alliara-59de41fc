import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const proseComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-3 mb-2 text-lg font-semibold tracking-tight text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 text-base font-semibold tracking-tight text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-1 text-[15px] font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="font-medium text-primary-foreground underline underline-offset-2 decoration-primary/60 hover:decoration-primary" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-mono text-[13px] leading-relaxed text-foreground">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto last:mb-0">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-primary pl-3 text-muted-foreground last:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
};

interface MarkdownProseProps {
  content: string;
  className?: string;
  /** Compact chat bubbles vs article reader */
  variant?: "chat" | "article";
}

export function MarkdownProse({ content, className, variant = "chat" }: MarkdownProseProps) {
  return (
    <div
      className={cn(
        "text-foreground/90",
        variant === "chat" && "text-[15px]",
        variant === "article" && "text-sm sm:text-[15px] leading-relaxed",
        className,
      )}
    >
      <ReactMarkdown components={proseComponents}>{content}</ReactMarkdown>
    </div>
  );
}
