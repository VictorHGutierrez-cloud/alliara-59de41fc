import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic — Alliara" }] }),
  component: () => <Navigate to="/partners" replace />,
});