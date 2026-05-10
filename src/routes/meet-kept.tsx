import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

/** Old short URL: send signed in users to the Kept hub; others to the intro tour. */
export const Route = createFileRoute("/meet-kept")({
  component: MeetKeptRedirect,
});

function MeetKeptRedirect() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (user) void nav({ to: "/kept", replace: true });
    else void nav({ to: "/intro", replace: true });
  }, [loading, user, nav]);
  return (
    <div className="page-shell flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
      One moment…
    </div>
  );
}
