"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LiveTimer } from "@/components/booking/live-timer";
import { startShiftAction, endShiftAction } from "@/lib/actions/booking-lifecycle";
import { trackBookingStarted, trackBookingEnded } from "@/lib/posthog-events";

export function ShiftControls({
  bookingId,
  status,
  actualStartAt,
}: {
  bookingId: string;
  status: string;
  actualStartAt: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStart() {
    setPending(true);
    setError(null);
    try {
      await startShiftAction(bookingId);
      trackBookingStarted(bookingId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start shift.");
    } finally {
      setPending(false);
    }
  }

  async function handleEnd() {
    setPending(true);
    setError(null);
    try {
      await endShiftAction(bookingId);
      trackBookingEnded(bookingId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not end shift.");
    } finally {
      setPending(false);
    }
  }

  if (status === "confirmed") {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={handleStart} disabled={pending}>
          {pending ? "Starting…" : "Start Shift"}
        </Button>
      </div>
    );
  }

  if (status === "in_progress" && actualStartAt) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-success">
          ● Shift started{" "}
          {new Date(actualStartAt).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <LiveTimer startedAt={actualStartAt} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={handleEnd} disabled={pending} variant="secondary">
          {pending ? "Ending…" : "End Shift"}
        </Button>
      </div>
    );
  }

  return null;
}
