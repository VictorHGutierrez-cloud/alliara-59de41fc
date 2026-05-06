import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/components/ui/confirm-provider";

export const Route = createFileRoute("/partner/$partnerId/stakeholders")({
  head: () => ({ meta: [{ title: "Stakeholders — Alliara" }] }),
  component: StakeholdersPage,
});

type Stakeholder = Database["public"]["Tables"]["partner_stakeholders"]["Row"];
type Role = Database["public"]["Enums"]["stakeholder_role"];

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ceo", label: "CEO / Founder" },
  { value: "it", label: "IT / Technical" },
  { value: "ae", label: "AE / Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

const roleLabel = (r: Role) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;
const roleColor = (r: Role): string => ({
  ceo: "octa-1", it: "octa-4", ae: "octa-5", marketing: "octa-7", other: "octa-3",
}[r] ?? "octa-3");

function StakeholdersPage() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const confirmDialog = useConfirmDialog();

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: rows }, { data: p }] = await Promise.all([
      supabase.from("partner_stakeholders").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("partners").select("owner_id").eq("id", partnerId).maybeSingle(),
    ]);
    setItems((rows ?? []) as Stakeholder[]);
    setIsOwner(!!user && p?.owner_id === user.id);
    setLoading(false);
  }, [partnerId, user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const remove = async (id: string) => {
    const ok = await confirmDialog({ title: "Remove this stakeholder?", actionLabel: "Remove" });
    if (!ok) return;
    const { error } = await supabase.from("partner_stakeholders").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Stakeholder removed"); refresh(); }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Stakeholders</h2>
          <p className="text-sm text-muted-foreground">Key contacts driving this partnership.</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowNew(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
            + Add Stakeholder
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">No stakeholders mapped yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((s) => {
            const c = roleColor(s.role);
            return (
              <div key={s.id} className="rounded-xl bg-card border border-border/60 p-4 card-elev">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.name}</div>
                    {s.position && <div className="text-xs text-muted-foreground truncate">{s.position}</div>}
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ background: `color-mix(in oklab, var(--${c}) 22%, transparent)`, color: `var(--${c})` }}
                  >
                    {roleLabel(s.role)}
                  </span>
                </div>
                {s.email && (
                  <a href={`mailto:${s.email}`} className="mt-3 block text-xs text-primary hover:underline truncate">
                    {s.email}
                  </a>
                )}
                {s.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{s.notes}</p>}
                {isOwner && (
                  <div className="mt-3 flex gap-3 text-xs">
                    <button onClick={() => setEditing(s)} className="text-muted-foreground hover:text-foreground">Edit</button>
                    <button onClick={() => remove(s.id)} className="text-destructive hover:underline">Remove</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(showNew || editing) && user && (
        <StakeholderDialog
          partnerId={partnerId}
          userId={user.id}
          existing={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function StakeholderDialog({
  partnerId, userId, existing, onClose, onSaved,
}: {
  partnerId: string; userId: string; existing: Stakeholder | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [position, setPosition] = useState(existing?.position ?? "");
  const [role, setRole] = useState<Role>(existing?.role ?? "other");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const payload = {
      partner_id: partnerId,
      user_id: userId,
      name: name.trim(),
      email: email.trim() || null,
      position: position.trim() || null,
      role,
      notes: notes.trim() || null,
    };
    const { error } = existing
      ? await supabase.from("partner_stakeholders").update(payload).eq("id", existing.id)
      : await supabase.from("partner_stakeholders").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(existing ? "Stakeholder updated" : "Stakeholder added"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">{existing ? "Edit stakeholder" : "Add stakeholder"}</h2>
        <div className="mt-5 space-y-3">
          <Field label="Name *"><input value={name} onChange={(e) => setName(e.target.value)} className="input" maxLength={120} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" maxLength={255} /></Field>
            <Field label="Position"><input value={position} onChange={(e) => setPosition(e.target.value)} className="input" maxLength={120} placeholder="e.g. Head of Sales" /></Field>
          </div>
          <Field label="Main function in partnership *">
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px]" maxLength={500} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
          <button onClick={save} disabled={!name.trim() || busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40">
            {existing ? "Save" : "Add"}
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