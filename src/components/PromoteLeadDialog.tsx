import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { PARTNER_TYPES, type PartnerType } from "@/lib/partner-types";

export function PromoteLeadDialog({
  open,
  companyName,
  defaultType,
  ownerName,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  companyName: string;
  defaultType: PartnerType | null;
  ownerName: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (overrides: { partner_type: PartnerType }) => void | Promise<void>;
}) {
  const [type, setType] = useState<PartnerType>(defaultType ?? "referral");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Promote to Partner</p>
            <h2 className="text-lg font-semibold mt-0.5">{companyName}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground rounded-md p-1">
            <XIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="px-6 py-4 space-y-4 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Lands in portfolio of</span>
            <span className="font-medium">{ownerName}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Initial tier</span>
            <span className="font-medium">Emerging</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Initial status</span>
            <span className="font-medium">Active</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Partner type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PartnerType)}
              className="mt-1 w-full rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm"
            >
              {PARTNER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            A new partner workspace will be created with the scorecard summary in its notes. The lead will be marked as Approved.
          </p>
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface/40">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => void onConfirm({ partner_type: type })}
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            {busy ? "Promoting…" : "Promote to Partner →"}
          </button>
        </footer>
      </div>
    </div>
  );
}