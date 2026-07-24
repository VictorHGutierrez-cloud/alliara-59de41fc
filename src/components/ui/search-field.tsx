import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn("relative flex-1 max-w-md", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "min-h-11 w-full rounded-xl border border-border/70 bg-card/80 py-2.5 pl-10 pr-3 text-sm",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          "transition-[border-color,box-shadow,background] duration-200",
          "placeholder:text-muted-foreground/70",
          "focus:border-primary/40 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20",
        )}
      />
    </div>
  );
}
