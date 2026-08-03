"use client";

import { useMemo, useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { cn } from "@/lib/ui";
import {
  DURATION_OPTIONS,
  computeBookingWindow,
  computePrice,
  earliestBookableStart,
  suggestedBookableStart,
} from "@/lib/booking";
import {
  trackBookingInitiated,
  trackCareInstructionsCompleted,
  trackPaymentQrGenerated,
} from "@/lib/posthog-events";
import { createBookingAction, type CreateBookingResult } from "@/lib/actions/booking";

type Nurse = {
  id: string;
  name: string;
  ratingAvg: number;
  ratingCount: number;
  pricePerDay: number;
};

type ExistingPatient = { name: string; condition: string } | null;
type ExistingContact = { name: string; phone: string; relation: string } | null;

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function BookingFlow({
  nurse,
  existingPatient,
  existingContact,
}: {
  nurse: Nurse;
  existingPatient: ExistingPatient;
  existingContact: ExistingContact;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const earliest = useMemo(() => earliestBookableStart(), []);
  const suggested = useMemo(() => suggestedBookableStart(), []);

  const [startDate, setStartDate] = useState(toDateInputValue(suggested));
  const [startTimeStr, setStartTimeStr] = useState(
    `${String(suggested.getHours()).padStart(2, "0")}:${String(
      suggested.getMinutes()
    ).padStart(2, "0")}`
  );
  const [duration, setDuration] = useState("1d");

  const [careInstructions, setCareInstructions] = useState("");
  const [patientName, setPatientName] = useState("");
  const [conditionSummary, setConditionSummary] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Extract<CreateBookingResult, { bookingId: string }> | null>(
    null
  );

  const startDateTime = useMemo(() => {
    if (!startDate || !startTimeStr) return null;
    const d = new Date(`${startDate}T${startTimeStr}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [startDate, startTimeStr]);

  const window = startDateTime ? computeBookingWindow(startDateTime, duration) : null;
  const totalPrice = computePrice(nurse.pricePerDay, duration);

  function handleContinueToDetails() {
    if (!startDateTime) {
      setError("Pick a start date and time.");
      return;
    }
    if (startDateTime < earliestBookableStart()) {
      setError("Bookings need at least 8 hours' notice.");
      return;
    }
    setError(null);
    trackBookingInitiated(nurse.id);
    setStep(2);
  }

  async function handleContinueToPayment() {
    if (!careInstructions.trim()) {
      setError("Care instructions are required.");
      return;
    }
    if (!existingPatient && (!patientName.trim() || !conditionSummary.trim())) {
      setError("Patient name and condition are required.");
      return;
    }
    if (
      !existingContact &&
      (!contactName.trim() || !contactPhone.trim() || !contactRelation.trim())
    ) {
      setError("Emergency contact details are required.");
      return;
    }

    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.set("nurseId", nurse.id);
    fd.set("startTime", startDateTime!.toISOString());
    fd.set("duration", duration);
    fd.set("careInstructions", careInstructions.trim());
    if (!existingPatient) {
      fd.set("patientName", patientName.trim());
      fd.set("conditionSummary", conditionSummary.trim());
    }
    if (!existingContact) {
      fd.set("contactName", contactName.trim());
      fd.set("contactPhone", contactPhone.trim());
      fd.set("contactRelation", contactRelation.trim());
    }

    const res = await createBookingAction(fd);
    setPending(false);

    if ("error" in res) {
      setError(res.error);
      return;
    }

    trackCareInstructionsCompleted(res.bookingId);
    setResult(res);
    trackPaymentQrGenerated(res.bookingId);
    setStep(3);
  }

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-10">
      <div className="flex flex-col gap-6">
        <StepIndicator
          steps={["Dates & Duration", "Care Details", "Payment"]}
          current={step}
        />

        {error && (
          <p className="text-sm text-danger bg-danger-tint rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              When do you need {nurse.name.split(" ")[0]}?
            </h1>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="Start date" htmlFor="startDate">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>
              <FormField label="Start time" htmlFor="startTimeStr">
                <Input
                  id="startTimeStr"
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                />
              </FormField>
            </div>

            <p className="text-xs text-muted">
              Bookings need at least 8 hours&apos; notice — the earliest
              start from right now is{" "}
              {earliest.toLocaleString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}
              .
            </p>

            <div>
              <p className="text-sm font-medium text-ink mb-2">
                How long do you need care?
              </p>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium",
                      duration === opt.value
                        ? "bg-primary text-white border-primary"
                        : "border-border text-ink-soft hover:bg-primary-tint/40"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {window && window.shifts > 1 && (
                <p className="text-xs text-muted mt-2">
                  Your booking will run as {window.shifts} consecutive
                  one-day shifts, {startTimeStr} – {startTimeStr}.
                </p>
              )}
            </div>

            <Button onClick={handleContinueToDetails} className="w-fit">
              Continue to Care Details →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Tell {nurse.name.split(" ")[0]} what to expect
            </h1>

            <div>
              <p className="text-sm font-medium text-ink mb-1">Patient</p>
              {existingPatient ? (
                <p className="text-sm text-ink-soft border border-border rounded-lg px-3.5 py-3 bg-white">
                  {existingPatient.name} · {existingPatient.condition}
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField label="Patient name" htmlFor="patientName">
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Lakshmi Krishnan"
                    />
                  </FormField>
                  <FormField label="Condition summary" htmlFor="conditionSummary">
                    <Input
                      id="conditionSummary"
                      value={conditionSummary}
                      onChange={(e) => setConditionSummary(e.target.value)}
                      placeholder="Early-stage Alzheimer's"
                    />
                  </FormField>
                </div>
              )}
            </div>

            <FormField label="Care instructions" htmlFor="careInstructions">
              <Textarea
                id="careInstructions"
                rows={4}
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="Medication schedule, daily routine, behavioural notes…"
              />
            </FormField>

            <div>
              <p className="text-sm font-medium text-ink mb-1">
                Emergency contact
              </p>
              {existingContact ? (
                <p className="text-sm text-ink-soft border border-border rounded-lg px-3.5 py-3 bg-white">
                  {existingContact.name} ({existingContact.relation}) ·{" "}
                  {existingContact.phone}
                </p>
              ) : (
                <div className="grid sm:grid-cols-3 gap-5">
                  <FormField label="Name" htmlFor="contactName">
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Relationship" htmlFor="contactRelation">
                    <Input
                      id="contactRelation"
                      value={contactRelation}
                      onChange={(e) => setContactRelation(e.target.value)}
                      placeholder="Son"
                    />
                  </FormField>
                  <FormField label="Phone" htmlFor="contactPhone">
                    <Input
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98xxxxxxxx"
                    />
                  </FormField>
                </div>
              )}
              <p className="text-xs text-muted mt-1.5">
                Used only for SOS alerts during this booking.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={handleContinueToPayment} disabled={pending}>
                {pending ? "Creating booking…" : "Continue to Payment →"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="flex flex-col gap-5 items-start">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Pay securely via UPI
            </h1>
            <p className="text-3xl font-semibold text-ink">
              ₹{result.totalPrice}
            </p>
            <p className="text-muted -mt-3">
              for {window?.shifts ?? 1} day
              {(window?.shifts ?? 1) > 1 ? "s" : ""} with {nurse.name}
            </p>

            <Card className="flex flex-col items-center gap-3 w-full sm:w-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.qrDataUrl}
                alt="UPI QR code"
                className="w-48 h-48"
              />
              <p className="text-sm text-muted">Scan with any UPI app</p>
              <p className="text-xs text-muted font-mono">
                UPI Ref: {result.referenceCode}
              </p>
            </Card>

            <a
              href={`/bookings/${result.bookingId}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors px-6 py-3 text-[15px] bg-primary text-white hover:bg-primary-dark"
            >
              I&apos;ve Paid
            </a>
            <p className="text-xs text-muted">
              Payment is confirmed manually — this usually takes a few
              minutes.
            </p>
          </div>
        )}
      </div>

      <div>
        <Card className="sticky top-24 flex flex-col gap-2">
          <p className="font-semibold text-ink">{nurse.name}</p>
          <StarRatingDisplay value={nurse.ratingAvg} count={nurse.ratingCount} />
          <div className="border-t border-border my-2" />
          {window ? (
            <>
              <p className="text-sm text-ink-soft">
                {window.shifts} day{window.shifts > 1 ? "s" : ""} × ₹
                {nurse.pricePerDay}
              </p>
              <p className="text-xl font-semibold text-ink">₹{totalPrice}</p>
            </>
          ) : (
            <p className="text-sm text-muted">₹{nurse.pricePerDay} /8-hr shift</p>
          )}
        </Card>
      </div>
    </div>
  );
}
