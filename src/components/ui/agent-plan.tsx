import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { AXES } from "@/content/octa";

export type AgentStatus = "todo" | "doing" | "done" | "need-help" | "failed";
export type AgentPriority = "low" | "medium" | "high";

export interface AgentSubtask {
  id: string;
  title: string;
  description?: string;
  status: AgentStatus;
}

export interface AgentTask {
  id: string;
  title: string;
  description?: string;
  status: AgentStatus;
  priority: AgentPriority;
  axisKey?: string | null;
  dueDate?: string | null;
  targetLevel?: number | null;
  source?: string | null;
  subtasks?: AgentSubtask[];
}

interface AgentPlanProps {
  tasks: AgentTask[];
  isOwner?: boolean;
  onCycleStatus?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

function StatusIcon({ status, className = "h-4.5 w-4.5" }: { status: AgentStatus; className?: string }) {
  if (status === "done") return <CheckCircle2 className={`${className} text-emerald-400`} />;
  if (status === "doing") return <CircleDotDashed className={`${className} text-sky-400 animate-spin-slow`} />;
  if (status === "need-help") return <CircleAlert className={`${className} text-amber-400`} />;
  if (status === "failed") return <CircleX className={`${className} text-destructive`} />;
  return <Circle className={`${className} text-muted-foreground`} />;
}

function statusLabel(s: AgentStatus): string {
  return ({ todo: "Planned", doing: "In Motion", done: "Delivered", "need-help": "Needs Help", failed: "Blocked" } as const)[s];
}

function PriorityChip({ p }: { p: AgentPriority }) {
  const cls = p === "high" ? "text-warning" : p === "medium" ? "text-foreground" : "text-muted-foreground";
  return <span className={`text-[10px] font-mono uppercase tracking-widest ${cls}`}>{p}</span>;
}

const prefersReducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

const taskVariants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -5 },
  visible: { opacity: 1, y: 0, transition: { type: prefersReducedMotion ? "tween" as const : "spring" as const, stiffness: 500, damping: 30 } },
  exit: { opacity: 0, y: prefersReducedMotion ? 0 : -5, transition: { duration: 0.15 } },
};

const subtaskListVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    height: "auto" as const,
    opacity: 1,
    transition: { duration: 0.25, staggerChildren: prefersReducedMotion ? 0 : 0.05, when: "beforeChildren" as const, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] },
  },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
};

const subtaskVariants = {
  hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -10 },
  visible: { opacity: 1, x: 0, transition: { type: prefersReducedMotion ? "tween" as const : "spring" as const, stiffness: 500, damping: 25 } },
  exit: { opacity: 0, x: prefersReducedMotion ? 0 : -10, transition: { duration: 0.15 } },
};

const detailsVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" as const, transition: { duration: 0.25, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
};

export function AgentPlan({ tasks, isOwner = false, onCycleStatus, onDelete }: AgentPlanProps) {
  const [expanded, setExpanded] = useState<string[]>(tasks[0] ? [tasks[0].id] : []);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <LayoutGroup>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {tasks.map((task) => {
            const isOpen = expanded.includes(task.id);
            const axis = task.axisKey ? AXES.find((a) => a.key === task.axisKey) : undefined;
            const hasDetails = (task.subtasks && task.subtasks.length > 0) || !!task.description;

            return (
              <motion.li
                key={task.id}
                variants={taskVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="rounded-xl bg-card border border-border/60"
              >
                <div className="flex items-start gap-3 p-3">
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOwner) onCycleStatus?.(task.id);
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                    className="mt-0.5 shrink-0"
                    aria-label="Cycle status"
                  >
                    <StatusIcon status={task.status} className="h-5 w-5" />
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => hasDetails && toggle(task.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {axis && (
                        <span
                          className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`,
                            color: `var(--${axis.color})`,
                          }}
                        >
                          {axis.letter} · {axis.name}
                        </span>
                      )}
                      {task.source === "ai" && (
                        <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">AI</span>
                      )}
                      <PriorityChip p={task.priority} />
                      {task.targetLevel && (
                        <span className="text-[10px] font-mono text-muted-foreground">→ L{task.targetLevel}</span>
                      )}
                    </div>
                    <div className={`mt-1.5 text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </div>
                    {task.dueDate && (
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">due {task.dueDate}</div>
                    )}
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground rounded-full border border-border/60 px-2 py-0.5">
                      {statusLabel(task.status)}
                    </span>
                    {isOwner && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(task.id)}
                        className="text-[11px] text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && hasDetails && (
                    <motion.div
                      variants={detailsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      <div className="relative pl-9 pr-4 pb-4">
                        {/* connector */}
                        <span className="absolute left-[22px] top-0 bottom-3 w-px bg-border/60" />
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <motion.ul
                            variants={subtaskListVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-1.5"
                          >
                            {task.subtasks.map((sub) => (
                              <motion.li
                                key={sub.id}
                                variants={subtaskVariants}
                                className="flex items-start gap-2 rounded-lg bg-surface/40 border border-border/40 px-2.5 py-1.5"
                              >
                                <StatusIcon status={sub.status} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs ${sub.status === "done" ? "line-through text-muted-foreground" : ""}`}>{sub.title}</div>
                                  {sub.description && (
                                    <div className="text-[11px] text-muted-foreground mt-0.5">{sub.description}</div>
                                  )}
                                </div>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </LayoutGroup>
  );
}