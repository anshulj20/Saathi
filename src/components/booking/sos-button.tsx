"use client";

import { useState } from "react";
import { triggerSosAction } from "@/lib/actions/sos";
import { trackSosTriggered } from "@/lib/posthog-events";

export function SosButton({
  bookingId,
  helperText,
}: {
  bookingId: string;
  helperText: string;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ recipient: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await triggerSosAction(bookingId);
      trackSosTriggered(res.route);
      setSent({ recipient: res.recipient });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the alert.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-success-tint border border-success/20 px-4 py-3 text-success text-sm font-medium">
        Alert sent to {sent.recipient}.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">{helperText}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-20 h-20 rounded-full bg-danger text-white font-bold text-lg shadow-[0_6px_20px_0_rgba(190,50,30,0.35)] disabled:opacity-60"
      >
        SOS
      </button>
    </div>
  );
}
