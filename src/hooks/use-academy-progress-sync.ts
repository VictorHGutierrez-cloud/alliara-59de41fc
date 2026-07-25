import { useEffect } from "react";
import { pushAcademyProgress, syncAcademyProgress } from "@/lib/academy-progress";

/** Pull cloud progress on login, push on unload. */
export function useAcademyProgressSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    void syncAcademyProgress(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void pushAcademyProgress(userId);
      }
    };

    const onCompanionChange = () => {
      void pushAcademyProgress(userId);
    };

    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("kept-companion-changed", onCompanionChange);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("kept-companion-changed", onCompanionChange);
      void pushAcademyProgress(userId);
    };
  }, [userId]);
}
