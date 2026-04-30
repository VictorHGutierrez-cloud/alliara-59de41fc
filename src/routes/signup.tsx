import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, ALLOWED_EMAIL_DOMAIN, isAllowedEmail } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Input } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  const { signUp, user, resendVerification } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/partners", replace: true });
  }, [user, nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (!isAllowedEmail(email)) {
      return toast.error(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`);
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
            Click the link in the email to activate your account. It may take a minute to arrive — also check spam.
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
            className="w-full rounded-lg border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
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
    <AuthLayout title="Create your account" sub={`Sign up with your @${ALLOWED_EMAIL_DOMAIN} email.`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Your name" value={name} onChange={setName} required />
        <Input label={`Work email (@${ALLOWED_EMAIL_DOMAIN})`} type="email" value={email} onChange={setEmail} required />
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
