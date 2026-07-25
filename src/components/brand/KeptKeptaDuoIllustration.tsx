import { cn } from "@/lib/utils";

import imgWelcomeAcademy from "@/assets/duo/duo-welcome-academy.png";
import imgLibraryPlaybooks from "@/assets/duo/duo-library-playbooks.png";
import imgCoachDealHelp from "@/assets/duo/duo-coach-deal-help.png";
import imgLearningTracks from "@/assets/duo/duo-learning-tracks.png";
import imgDailyBriefing from "@/assets/duo/duo-daily-briefing.png";
import imgDealPipeline from "@/assets/duo/duo-deal-pipeline.png";

/** Kept + Kepta together — scenes from Executive Academy. */
export type KeptKeptaDuoVariant =
  | "welcomeAcademy"
  | "libraryPlaybooks"
  | "coachDealHelp"
  | "learningTracks"
  | "dailyBriefing"
  | "dealPipeline";

const SRC: Record<KeptKeptaDuoVariant, string> = {
  welcomeAcademy: imgWelcomeAcademy,
  libraryPlaybooks: imgLibraryPlaybooks,
  coachDealHelp: imgCoachDealHelp,
  learningTracks: imgLearningTracks,
  dailyBriefing: imgDailyBriefing,
  dealPipeline: imgDealPipeline,
};

const DEFAULT_ALT: Record<KeptKeptaDuoVariant, string> = {
  welcomeAcademy: "Kept and Kepta welcoming you to Executive Academy",
  libraryPlaybooks: "Kept and Kepta browsing the sales playbook library",
  coachDealHelp: "Kept and Kepta using the situational deal coach",
  learningTracks: "Kept and Kepta following a learning track with progress",
  dailyBriefing: "Kept and Kepta reading the daily sales briefing",
  dealPipeline: "Kept and Kepta reviewing a stuck deal in the pipeline",
};

export interface KeptKeptaDuoIllustrationProps {
  variant: KeptKeptaDuoVariant;
  className?: string;
  alt?: string;
  decorative?: boolean;
  imageLoading?: "eager" | "lazy";
}

export function KeptKeptaDuoIllustration({
  variant,
  className,
  alt,
  decorative = false,
  imageLoading = "lazy",
}: KeptKeptaDuoIllustrationProps) {
  const resolvedAlt = decorative ? "" : (alt ?? DEFAULT_ALT[variant]);

  return (
    <img
      src={SRC[variant]}
      alt={resolvedAlt}
      aria-hidden={decorative ? true : undefined}
      loading={imageLoading}
      decoding="async"
      draggable={false}
      className={cn("block h-auto w-full max-w-full object-contain select-none", className)}
    />
  );
}
