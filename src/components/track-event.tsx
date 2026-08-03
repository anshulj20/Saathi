"use client";

import { useEffect, useRef } from "react";
import {
  trackSearchPerformed,
  trackProfileViewed,
} from "@/lib/posthog-events";

function useOnceWhenChanged(dep: string, fire: () => void) {
  const last = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (last.current === dep) return;
    last.current = dep;
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}

export function TrackSearchPerformed({ dep }: { dep: string }) {
  useOnceWhenChanged(dep, trackSearchPerformed);
  return null;
}

export function TrackProfileViewed({ nurseId }: { nurseId: string }) {
  useOnceWhenChanged(nurseId, () => trackProfileViewed(nurseId));
  return null;
}
