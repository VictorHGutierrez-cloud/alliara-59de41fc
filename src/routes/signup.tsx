import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, isValidEmail } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Input, GoogleIcon } from "./login";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search.email === "string" && search.email.trim()) {
      return { email: search.email.trim().slice(0, 320) };
    }
    return {};
  },
  component: SignUp,
});

function SignUp() {
  const { signUp, user, resendVerification, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => search.email ?? "");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/partners", replace: true });
  }, [user, nav]);

  useEffect(() => {
    if (search.email) setEmail(search.email);
  }, [search.email]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters for your password.");
    if (!isValidEmail(email)) {
      return toast.error("Please enter a valid email address.");
    }
    setBusy(true);
    const { error, needsVerification } = await signUp(email, pw, name);
    setBusy(false);
    if (error) return toast.error(error);
    if (needsVerification) {
      setSentTo(email);
      toast.success("Verification email sent");
      return;
    }
    toast.success("Account created");
    nav({ to: "/partners" });
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" sub={`We sent a verification link to ${sentTo}.`}>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Open the link in that email to finish setup. It can take a minute—peek in spam if you do not see it.
          </p>
          <button
            disabled={resending}
            onClick={async () => {
              setResending(true);
              const { error } = await resendVerification(sentTo);
              setResending(false);
              if (error) toast.error(error);
              else toast.success("Verification email resent");
            }}
            className="w-full min-h-11 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend verification email"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already verified? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" sub="Sign up in seconds — Google or email, your call.">
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
        <Input label="Your name" value={name} onChange={setName} required />
        <Input label="Email" type="email" value={email} onChange={setEmail} required />
        <Input label="Password (8+ chars)" type="password" value={pw} onChange={setPw} required />
        <button disabled={busy} className="w-full min-h-11 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Already have one? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
