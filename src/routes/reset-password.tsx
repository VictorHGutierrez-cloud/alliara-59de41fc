import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Input } from "./login";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const { updatePassword } = useAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success("Password updated");
    nav({ to: "/partners" });
  };

  return (
    <AuthLayout title="Set a new password" sub="Pick something strong you will remember.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="New password (8+ chars)" type="password" value={pw} onChange={setPw} required />
        <Input label="Confirm password" type="password" value={pw2} onChange={setPw2} required />
        <button disabled={busy} className="w-full min-h-11 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Saving…" : "Update password"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}