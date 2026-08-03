"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { cancelByNurseAction } from "@/lib/actions/booking-lifecycle";

export function CancelMenu({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await cancelByNurseAction(bookingId, reason);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel booking.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted hover:text-danger"
      >
        Can&apos;t make this shift? Cancel booking
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-border rounded-lg p-4 bg-white">
      <p className="text-sm font-medium text-ink">
        Cancel this booking — a reason is required
      </p>
      <Textarea
        rows={2}
        placeholder="Why can't you make it?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button variant="danger" size="sm" onClick={handleCancel} disabled={pending}>
          {pending ? "Cancelling…" : "Confirm cancellation"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </div>
  );
}
