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
  const { signIn, user, resendVerification } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/partners", replace: true });
  }, [user, nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, pw);
    setBusy(false);
    if (error) {
      const msg = error.toLowerCase();
      if (msg.includes("email") && (msg.includes("not confirmed") || msg.includes("confirm"))) {
        setNeedsVerify(true);
      }
      return toast.error(error);
    }
    toast.success("Welcome back");
    nav({ to: "/partners" });
  };

  return (
    <AuthLayout title="Sign in" sub="Pick up where you left off with your partners.">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Work email" type="email" value={email} onChange={setEmail} required />
        <Input label="Password" type="password" value={pw} onChange={setPw} required />
        <button disabled={busy} className="w-full min-h-11 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {needsVerify && (
          <button
            type="button"
            disabled={resending || !email}
            onClick={async () => {
              setResending(true);
              const { error } = await resendVerification(email);
              setResending(false);
              if (error) toast.error(error);
              else toast.success("Verification email sent — check your inbox.");
            }}
            className="w-full min-h-11 rounded-xl border border-border bg-surface py-2 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend verification email"}
          </button>
        )}
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
      <div className="rounded-2xl bg-card border border-border/50 p-8 card-elev shadow-sm">
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
        className="w-full min-h-11 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-primary/15"
      />
    </label>
  );
}
