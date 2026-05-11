import { useEffect, useState } from "react";
import { AXES } from "@/content/octa";
import type { ActionRow } from "@/lib/partners-store";
import { COPY } from "@/lib/copy";

export function PartnerTaskEditDialog({
  action,
  titleText,
  onClose,
  onSave,
}: {
  action: ActionRow | null;
  titleText?: string;
  onClose: () => void;
  onSave: (
    id: string,
    patch: {
      axis_key: string;
      title: string;
      description: string | null;
      priority: ActionRow["priority"];
      target_level: number | null;
      due_date: string | null;
    },
  ) => Promise<void>;
}) {
  const [axisKey, setAxisKey] = useState(AXES[0].key);
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ActionRow["priority"]>("medium");
  const [targetLevel, setTargetLevel] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!action) return;
    setAxisKey(action.axis_key);
    setTaskTitle(action.title);
    setDescription(action.description ?? "");
    setPriority(action.priority);
    setTargetLevel(action.target_level ?? "");
    setDueDate(action.due_date ?? "");
  }, [action]);

  if (!action) return null;

  const heading = titleText ?? COPY.jbp.editMoveTitle;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-elev w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-task-heading" className="text-xl font-semibold">
          {heading}
        </h2>
        <div className="mt-5 space-y-3">
          <Field label={COPY.jbp.editFieldAxis}>
            <select
              value={axisKey}
              onChange={(e) => setAxisKey(e.target.value)}
              className="input min-h-11"
            >
              {AXES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.letter} · {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={COPY.jbp.editFieldTitle}>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="input min-h-11"
              placeholder="What needs to happen?"
            />
          </Field>
          <Field label={COPY.jbp.editFieldDescription}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={COPY.jbp.editFieldPriority}>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionRow["priority"])}
                className="input min-h-11"
              >
                <option value="low">{COPY.jbp.priorityLow}</option>
                <option value="medium">{COPY.jbp.priorityMedium}</option>
                <option value="high">{COPY.jbp.priorityHigh}</option>
              </select>
            </Field>
            <Field label={COPY.jbp.editFieldTarget}>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value ? Number(e.target.value) : "")}
                className="input min-h-11"
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    L{n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={COPY.jbp.editFieldDue}>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input min-h-11"
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            {COPY.jbp.cancelCta}
          </button>
          <button
            type="button"
            disabled={!taskTitle.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(action.id, {
                  axis_key: axisKey,
                  title: taskTitle.trim(),
                  description: description.trim() ? description.trim() : null,
                  priority,
                  target_level: targetLevel === "" ? null : targetLevel,
                  due_date: dueDate ? dueDate : null,
                });
                onClose();
              } finally {
                setBusy(false);
              }
            }}
            className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            {COPY.jbp.saveMoveCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
