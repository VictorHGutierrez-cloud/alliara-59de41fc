import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Input } from "./login";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await sendPasswordReset(email);
    setBusy(false);
    if (error) return toast.error(error);
    setSent(true);
    toast.success("Reset link sent");
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" sub={`We sent a reset link to ${email}.`}>
        <p className="text-sm text-muted-foreground">
          Open the link to choose a new password. Did not arrive? Peek in spam.
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" sub="We will email you a secure link.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Work email" type="email" value={email} onChange={setEmail} required />
        <button disabled={busy} className="w-full min-h-11 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}