import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      // soft check; AuthProvider also handles redirects
    }
  },
  component: Login,
});

function Login() {
  const { signIn, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/partners", replace: true });
  }, [user, nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, pw);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success("Welcome back");
    nav({ to: "/partners" });
  };

  return (
    <AuthLayout title="Sign in" sub="Continue building your partner OS.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Work email" type="email" value={email} onChange={setEmail} required />
        <Input label="Password" type="password" value={pw} onChange={setPw} required />
        <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl bg-card border border-border/60 p-8 card-elev">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
      />
    </label>
  );
}
