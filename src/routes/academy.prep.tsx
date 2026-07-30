import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { SituationForm } from "@/components/academy/SituationForm";

export const Route = createFileRoute("/academy/prep")({
  head: () => ({ meta: [{ title: COPY.academy.prepMetaTitle }] }),
  component: AcademyPrepPage,
});

function AcademyPrepPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <SituationForm
      mode="prep"
      eyebrow={COPY.academy.prepEyebrow}
      title={COPY.academy.prepTitle}
      intro={COPY.academy.prepIntro}
      situationLabel={COPY.academy.prepSituationLabel}
      situationPlaceholder={COPY.academy.prepSituationPlaceholder}
      submitLabel={COPY.academy.prepSubmit}
    />
  );
}
