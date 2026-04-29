import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Input } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  const { signUp, user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) throw redirect({ to: "/dashboard" });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await signUp(email, pw, name);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success("Account created");
    nav({ to: "/diagnostic" });
  };

  return (
    <AuthLayout title="Create your OCTA account" sub="Diagnose your ecosystem in under 5 minutes.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Your name" value={name} onChange={setName} required />
        <Input label="Work email" type="email" value={email} onChange={setEmail} required />
        <Input label="Password (8+ chars)" type="password" value={pw} onChange={setPw} required />
        <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Already have one? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
