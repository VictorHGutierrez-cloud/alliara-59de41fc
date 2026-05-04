"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DockItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface DockProps {
  className?: string;
  items: DockItem[];
}

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ className, items }, ref) => {
    return (
      <TooltipProvider delayDuration={120}>
        <motion.div
          ref={ref}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={cn(
            "fixed bottom-5 left-1/2 z-50 -translate-x-1/2",
            "flex items-center gap-1 rounded-2xl border border-border/60",
            "bg-background/70 px-2 py-2 shadow-2xl backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/50",
            className,
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Tooltip key={`${item.label}-${index}`}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={item.onClick}
                    aria-label={item.label}
                    className={cn(
                      "relative h-11 w-11 rounded-xl transition-transform",
                      "hover:scale-110 hover:bg-surface-2",
                      item.active && "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.active && (
                      <motion.span
                        layoutId="dock-active-dot"
                        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </motion.div>
      </TooltipProvider>
    );
  },
);
Dock.displayName = "Dock";

export default Dock;
export { Dock };