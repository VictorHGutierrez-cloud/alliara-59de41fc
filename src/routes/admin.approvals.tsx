import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth, type AccessStatus } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/approvals")({
  component: AdminApprovals,
});

type ProfileRow = {
  id: string;
  display_name: string | null;
  company: string | null;
  access_status: AccessStatus;
  created_at: string;
};

function AdminApprovals() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccessStatus | "all">("pending");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", replace: true });
    if (!loading && user && !isAdmin) nav({ to: "/partners", replace: true });
  }, [user, isAdmin, loading, nav]);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, company, access_status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as ProfileRow[]);
  }, []);

  useEffect(() => { if (isAdmin) void refresh(); }, [isAdmin, refresh]);

  const setStatus = async (id: string, status: AccessStatus) => {
    setBusy(id);
    const { error } = await supabase
      .from("profiles")
      .update({ access_status: status })
      .eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status}`);
    void refresh();
  };

  const visible = rows.filter((r) => filter === "all" || r.access_status === filter);

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Access requests</h1>
          <p className="text-sm text-muted-foreground">Approve or reject sign-ups for the workspace.</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AccessStatus | "all")}
          className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No requests.</td></tr>
            )}
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{r.display_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.company ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.access_status === "approved" ? "bg-green-100 text-green-800" :
                    r.access_status === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>{r.access_status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {r.access_status !== "approved" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, "approved")}
                        className="min-h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                      >Approve</button>
                    )}
                    {r.access_status !== "rejected" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, "rejected")}
                        className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-surface-2 disabled:opacity-50"
                      >Reject</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}