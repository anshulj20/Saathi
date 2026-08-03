export const DURATION_OPTIONS = [
  { value: "2h", label: "2 hrs", hours: 2, shifts: 1 },
  { value: "4h", label: "4 hrs", hours: 4, shifts: 1 },
  { value: "1d", label: "8 hrs (1 day)", hours: 8, shifts: 1 },
  { value: "2d", label: "2 days", hours: 48, shifts: 2 },
  { value: "3d", label: "3 days", hours: 72, shifts: 3 },
] as const;

export type DurationValue = (typeof DURATION_OPTIONS)[number]["value"];

export function getDurationOption(value: string) {
  return DURATION_OPTIONS.find((d) => d.value === value);
}

export function computeBookingWindow(startTime: Date, durationValue: string) {
  const option = getDurationOption(durationValue);
  if (!option) return null;
  const endTime = new Date(startTime.getTime() + option.hours * 60 * 60 * 1000);
  return { endTime, hours: option.hours, shifts: option.shifts };
}

export function computePrice(pricePerDay: number, durationValue: string) {
  const option = getDurationOption(durationValue);
  if (!option) return 0;
  return pricePerDay * option.shifts;
}

export const MIN_NOTICE_HOURS = 8;
export const MIN_DURATION_HOURS = 2;
export const MAX_DURATION_HOURS = 72;

export function earliestBookableStart(from: Date = new Date()) {
  return new Date(from.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
}

/** Earliest bookable start, rounded up to the next 15 min — used as the
 * booking form's default so minute-level truncation (or the time it takes
 * a user to fill the form) never lands it just under the notice minimum. */
export function suggestedBookableStart(from: Date = new Date()) {
  const earliest = earliestBookableStart(from);
  const step = 15 * 60 * 1000;
  return new Date(Math.ceil(earliest.getTime() / step) * step);
}

export function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function toTimeInputValue(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  reassignment_pending: "Finding a replacement nurse",
  reassignment_offered: "New nurse proposed",
};

export const STATUS_TONES: Record<
  string,
  "primary" | "success" | "danger" | "neutral"
> = {
  pending_payment: "primary",
  confirmed: "success",
  in_progress: "success",
  completed: "neutral",
  cancelled: "danger",
  reassignment_pending: "danger",
  reassignment_offered: "primary",
};
