import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pending-approval")({
  component: PendingApproval,
});

function PendingApproval() {
  const { user, accessStatus, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!user) nav({ to: "/login", replace: true });
    else if (accessStatus === "approved") nav({ to: "/partners", replace: true });
  }, [user, accessStatus, nav]);

  const rejected = accessStatus === "rejected";

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">
          {rejected ? "Access not granted" : "Awaiting approval"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected
            ? "Your access request was reviewed and not approved. Reach out to the workspace administrator if you believe this is a mistake."
            : "Thanks for signing up! Your account is pending review by an administrator. You will get access as soon as it is approved."}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">Signed in as {user?.email}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-surface-2"
          >
            Sign out
          </button>
          <Link
            to="/"
            className="min-h-11 inline-flex items-center rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:bg-surface-2"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}