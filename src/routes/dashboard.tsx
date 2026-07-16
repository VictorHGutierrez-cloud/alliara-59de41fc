import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/** Legacy path: after Executive Academy pivot, home is /academy. */
export const Route = createFileRoute("/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const nav = useNavigate();
  useEffect(() => {
    void nav({ to: "/academy", replace: true });
  }, [nav]);

  return (
    <div className="page-shell flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to Academy…
    </div>
  );
}
