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
  const { signIn, user, resendVerification, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

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
      <button
        type="button"
        disabled={googleBusy}
        onClick={async () => {
          setGoogleBusy(true);
          const { error } = await signInWithGoogle();
          if (error) {
            setGoogleBusy(false);
            toast.error(error);
          }
        }}
        className="mb-4 w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-50"
      >
        <GoogleIcon />
        {googleBusy ? "Connecting…" : "Continue with Google"}
      </button>
      <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Work email" type="email" value={email} onChange={setEmail} required />
        <Input label="Password" type="password" value={pw} onChange={setPw} required />
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>
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

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.3 2.4-6.9 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6 4.9c-.4.4 6.7-4.9 6.7-14.2 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
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
