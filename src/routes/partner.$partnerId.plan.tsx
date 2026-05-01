import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePartner, type ActionRow } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";
import { AgentPlan, type AgentTask } from "@/components/ui/agent-plan";

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

  const agentTasks = useMemo<AgentTask[]>(() => {
    return data.actions
      .filter((a) => filterAxis === "all" || a.axis_key === filterAxis)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description ?? undefined,
        status: a.status,
        priority: a.priority,
        axisKey: a.axis_key,
        dueDate: a.due_date,
        targetLevel: a.target_level,
        source: a.source,
      }));
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
        <div className="mt-6">
          <AgentPlan
            tasks={agentTasks}
            isOwner={isOwner}
            onCycleStatus={(id) => {
              const current = data.actions.find((a) => a.id === id);
              if (!current) return;
              const next: ActionRow["status"] =
                current.status === "todo" ? "doing" : current.status === "doing" ? "done" : "todo";
              data
                .updateAction(id, {
                  status: next,
                  completed_at: next === "done" ? new Date().toISOString() : null,
                })
                .catch((e) => toast.error((e as Error).message));
            }}
            onDelete={(id) => data.deleteAction(id).catch((e) => toast.error((e as Error).message))}
          />
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