"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { cn } from "@/lib/ui";
import {
  DURATION_OPTIONS,
  computeBookingWindow,
  computePrice,
  earliestBookableStart,
} from "@/lib/booking";
import { trackBookingInitiated } from "@/lib/posthog-events";

export function BookNowWidget({
  nurseId,
  pricePerDay,
  gender,
  initialDate,
  initialTime,
}: {
  nurseId: string;
  pricePerDay: number;
  gender: string;
  initialDate: string;
  initialTime: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState("1d");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startDateTime = useMemo(() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [date, time]);

  const window = startDateTime ? computeBookingWindow(startDateTime, duration) : null;
  const totalPrice = computePrice(pricePerDay, duration);

  function handleBookNow() {
    if (!startDateTime) {
      setError("Pick a valid date and time.");
      return;
    }
    if (startDateTime < earliestBookableStart()) {
      setError("Bookings need at least 8 hours' notice.");
      return;
    }
    setError(null);
    trackBookingInitiated(nurseId);
    const qs = new URLSearchParams({
      start: startDateTime.toISOString(),
      duration,
    });
    router.push(`/book/${nurseId}?${qs.toString()}`);
  }

  return (
    <Card className="sticky top-24 flex flex-col gap-3">
      <p className="text-2xl font-semibold text-ink">
        ₹{pricePerDay}{" "}
        <span className="text-sm font-normal text-muted">/8-hr shift</span>
      </p>
      <p className="text-sm text-muted">
        Gender: {gender[0].toUpperCase() + gender.slice(1)}
      </p>

      <div className="border-t border-border pt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bookDate">Date</Label>
            <Input
              id="bookDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bookTime">Time</Label>
            <Input
              id="bookTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">
            Length of care
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium",
                  duration === opt.value
                    ? "bg-primary text-white border-primary"
                    : "border-border text-ink-soft hover:bg-primary-tint/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {window && (
          <p className="text-sm text-ink-soft">
            {window.shifts} day{window.shifts > 1 ? "s" : ""} × ₹{pricePerDay} ={" "}
            <span className="font-semibold text-ink">₹{totalPrice}</span>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={handleBookNow} className="w-full">
        Book Now
      </Button>
      <p className="text-xs text-muted text-center">
        Bookings need at least 8 hours&apos; notice.
      </p>
    </Card>
  );
}
