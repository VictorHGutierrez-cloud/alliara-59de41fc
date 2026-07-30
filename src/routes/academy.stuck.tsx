import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { SituationForm } from "@/components/academy/SituationForm";

export const Route = createFileRoute("/academy/stuck")({
  head: () => ({ meta: [{ title: COPY.academy.stuckMetaTitle }] }),
  component: AcademyStuckPage,
});

function AcademyStuckPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <SituationForm
      mode="stuck"
      eyebrow={COPY.academy.stuckEyebrow}
      title={COPY.academy.stuckTitle}
      intro={COPY.academy.stuckIntro}
      situationLabel={COPY.academy.stuckSituationLabel}
      situationPlaceholder={COPY.academy.stuckSituationPlaceholder}
      submitLabel={COPY.academy.stuckSubmit}
    />
  );
}
