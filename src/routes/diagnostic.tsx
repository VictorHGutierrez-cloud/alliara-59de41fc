import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic — OCTA OS" }] }),
  component: () => <Navigate to="/partners" replace />,
});