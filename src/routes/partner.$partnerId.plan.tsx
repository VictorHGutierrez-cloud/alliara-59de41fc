import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePartner, type ActionRow } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/$partnerId/plan")({
  head: () => ({ meta: [{ title: "Joint Business Plan — OCTA OS" }] }),
  component: PartnerPlan,
});

function PartnerPlan() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const data = usePartner(partnerId);
  const [filterAxis, setFilterAxis] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);

  const grouped = useMemo(() => {
    const m: Record<ActionRow["status"], ActionRow[]> = { todo: [], doing: [], done: [] };
    for (const a of data.actions) {
      if (filterAxis !== "all" && a.axis_key !== filterAxis) continue;
      m[a.status].push(a);
    }
    return m;
  }, [data.actions, filterAxis]);

  if (data.loading || !user) return <div className="text-muted-foreground">Loading…</div>;

  const isOwner = data.partner?.owner_id === user.id;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Filter</label>
          <select
            value={filterAxis}
            onChange={(e) => setFilterAxis(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All axes</option>
            {AXES.map((a) => <option key={a.key} value={a.key}>{a.letter} · {a.name}</option>)}
          </select>
        </div>
        {isOwner && (
          <button onClick={() => setShowNew(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
            + Add Growth Initiative
          </button>
        )}
      </div>

      {data.actions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
          <h2 className="text-lg font-semibold">No growth initiatives yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Build the Joint Business Plan by growth axis. Or jump to the Ecosystem Copilot to generate prescriptive initiatives you can add in one click.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          {(["todo", "doing", "done"] as const).map((s) => (
            <Column
              key={s}
              title={({ todo: "Planned", doing: "In Motion", done: "Delivered" } as const)[s]}
              items={grouped[s]}
              isOwner={isOwner}
              onUpdate={(id, patch) => data.updateAction(id, patch).catch((e) => toast.error((e as Error).message))}
              onDelete={(id) => data.deleteAction(id).catch((e) => toast.error((e as Error).message))}
            />
          ))}
        </div>
      )}

      {showNew && isOwner && (
        <NewActionDialog
          onClose={() => setShowNew(false)}
          onCreate={async (input) => {
            try {
              await data.addAction({ ...input, userId: user.id });
              toast.success("Growth Initiative added");
              setShowNew(false);
            } catch (e) { toast.error((e as Error).message); }
          }}
        />
      )}
    </div>
  );
}

function Column({
  title, items, isOwner, onUpdate, onDelete,
}: {
  title: string;
  items: ActionRow[];
  isOwner: boolean;
  onUpdate: (id: string, patch: Partial<ActionRow>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface/40 border border-border/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs font-mono text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((a) => {
          const axis = AXES.find((x) => x.key === a.axis_key);
          return (
            <div key={a.id} className="rounded-xl bg-card border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {axis && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`, color: `var(--${axis.color})` }}
                      >
                        {axis.letter} · {axis.name}
                      </span>
                    )}
                    {a.source === "ai" && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">AI</span>
                    )}
                    <PriorityChip p={a.priority} />
                    {a.target_level && <span className="text-[10px] font-mono text-muted-foreground">→ L{a.target_level}</span>}
                  </div>
                  <div className="mt-1.5 text-sm font-medium">{a.title}</div>
                  {a.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{a.description}</div>}
                  {a.due_date && <div className="text-[10px] font-mono text-muted-foreground mt-2">due {a.due_date}</div>}
                </div>
              </div>
              {isOwner && (
                <div className="mt-3 flex items-center justify-between">
                  <select
                    value={a.status}
                    onChange={(e) => onUpdate(a.id, {
                      status: e.target.value as ActionRow["status"],
                      completed_at: e.target.value === "done" ? new Date().toISOString() : null,
                    })}
                    className="text-xs rounded-md bg-surface-2 border border-border/60 px-2 py-1"
                  >
                    <option value="todo">Planned</option>
                    <option value="doing">In Motion</option>
                    <option value="done">Delivered</option>
                  </select>
                  <button onClick={() => onDelete(a.id)} className="text-xs text-destructive hover:underline">Delete</button>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Empty</div>}
      </div>
    </div>
  );
}

function PriorityChip({ p }: { p: ActionRow["priority"] }) {
  const cls = p === "high" ? "text-warning" : p === "medium" ? "text-foreground" : "text-muted-foreground";
  return <span className={`text-[10px] font-mono uppercase tracking-widest ${cls}`}>{p}</span>;
}

function NewActionDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    axisKey: string; title: string; description?: string;
    priority?: ActionRow["priority"]; targetLevel?: number; dueDate?: string;
  }) => Promise<void>;
}) {
  const [axisKey, setAxisKey] = useState(AXES[0].key);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ActionRow["priority"]>("medium");
  const [targetLevel, setTargetLevel] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">New Growth Initiative</h2>
        <div className="mt-5 space-y-3">
          <Field label="Axis">
            <select value={axisKey} onChange={(e) => setAxisKey(e.target.value)} className="input">
              {AXES.map((a) => <option key={a.key} value={a.key}>{a.letter} · {a.name}</option>)}
            </select>
          </Field>
          <Field label="Title *"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" autoFocus placeholder="What needs to happen?" /></Field>
          <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as ActionRow["priority"])} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Target level">
              <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value ? Number(e.target.value) : "")} className="input">
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>L{n}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
          <button
            disabled={!title.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onCreate({
                  axisKey, title: title.trim(),
                  description: description.trim() || undefined,
                  priority,
                  targetLevel: targetLevel || undefined,
                  dueDate: dueDate || undefined,
                });
              } finally { setBusy(false); }
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            Add Initiative
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}