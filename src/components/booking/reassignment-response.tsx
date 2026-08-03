"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { respondToReassignmentAction } from "@/lib/actions/booking-lifecycle";

export function ReassignmentResponse({
  bookingId,
  nurseId,
  nurseName,
}: {
  bookingId: string;
  nurseId: string;
  nurseName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function respond(accept: boolean) {
    setPending(true);
    setError(null);
    try {
      await respondToReassignmentAction(bookingId, accept);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your response.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-primary-tint p-5 flex flex-col gap-3">
      <p className="font-semibold text-primary-darker">
        {nurseName} has been assigned to your booking
      </p>
      <p className="text-sm text-ink-soft">
        Your original nurse cancelled. Review {nurseName.split(" ")[0]}
        &apos;s profile and accept or reject this replacement.
      </p>
      <Link
        href={`/nurse/${nurseId}`}
        className="text-sm font-semibold text-primary-dark underline w-fit"
      >
        View profile →
      </Link>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={() => respond(true)} disabled={pending} size="sm">
          Accept
        </Button>
        <Button
          onClick={() => respond(false)}
          disabled={pending}
          size="sm"
          variant="secondary"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
