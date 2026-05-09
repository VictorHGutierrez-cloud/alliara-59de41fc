import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/** Memorável para links externos / onboarding — mesma experiência que `/intro`. */
export const Route = createFileRoute("/meet-kept")({
  component: MeetKeptRedirect,
});

function MeetKeptRedirect() {
  const nav = useNavigate();
  useEffect(() => {
    void nav({ to: "/intro", replace: true });
  }, [nav]);
  return (
    <div className="page-shell flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
      Taking you to the intro tour…
    </div>
  );
}
