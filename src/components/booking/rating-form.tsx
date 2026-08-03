"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { submitRatingAction } from "@/lib/actions/rating";
import { trackRatingSubmitted } from "@/lib/posthog-events";

export function RatingForm({ bookingId }: { bookingId: string }) {
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      await submitRatingAction(bookingId, stars, feedback);
      trackRatingSubmitted(bookingId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit rating.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-xl font-semibold text-ink">
        How was your experience?
      </h2>
      <StarRatingInput name="stars" value={stars} onChange={setStars} />
      <Textarea
        rows={3}
        placeholder="Optional feedback for the nurse and future families…"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={handleSubmit} disabled={pending} className="w-fit">
        {pending ? "Submitting…" : "Submit rating"}
      </Button>
    </div>
  );
}
