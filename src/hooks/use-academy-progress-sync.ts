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

    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      void pushAcademyProgress(userId);
    };
  }, [userId]);
}
