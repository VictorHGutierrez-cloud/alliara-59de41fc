import { useState } from "react";
import { MoveCompleteCelebration } from "@/components/ui/move-complete-celebration";

export function useCompletionCelebration() {
  const [burstAt, setBurstAt] = useState<number | null>(null);

  function celebrate() {
    setBurstAt(Date.now());
  }

  const celebration = (
    <MoveCompleteCelebration burstAt={burstAt} onConsumed={() => setBurstAt(null)} />
  );

  return { celebrate, celebration };
}
