import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/** Legacy partner home: redirect to Executive Academy hub. */
export const Route = createFileRoute("/partners")({
  component: PartnersRedirect,
});

function PartnersRedirect() {
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
