import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic — Conduit" }] }),
  component: () => <Navigate to="/partners" replace />,
});