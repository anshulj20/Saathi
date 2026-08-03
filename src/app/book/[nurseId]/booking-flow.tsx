"use client";

import { useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { computeBookingWindow, computePrice } from "@/lib/booking";
import {
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

type Patient = { name: string; condition: string };
type ExistingContact = { name: string; phone: string; relation: string } | null;

export function BookingFlow({
  nurse,
  startTime,
  duration,
  patient,
  existingContact,
}: {
  nurse: Nurse;
  startTime: string;
  duration: string;
  patient: Patient;
  existingContact: ExistingContact;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const [careInstructions, setCareInstructions] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Extract<CreateBookingResult, { bookingId: string }> | null>(
    null
  );

  const startDateTime = new Date(startTime);
  const window = computeBookingWindow(startDateTime, duration);
  const totalPrice = computePrice(nurse.pricePerDay, duration);

  async function handleContinueToPayment() {
    if (!careInstructions.trim()) {
      setError("Care instructions are required.");
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
    fd.set("startTime", startTime);
    fd.set("duration", duration);
    fd.set("careInstructions", careInstructions.trim());
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
    setStep(2);
  }

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-10">
      <div className="flex flex-col gap-6">
        <StepIndicator steps={["Care Details", "Payment"]} current={step} />

        {error && (
          <p className="text-sm text-danger bg-danger-tint rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Tell {nurse.name.split(" ")[0]} what to expect
            </h1>
            <p className="text-sm text-muted -mt-3">
              {startDateTime.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              · {window?.shifts ?? 1} day{(window?.shifts ?? 1) > 1 ? "s" : ""}
            </p>

            <div>
              <p className="text-sm font-medium text-ink mb-1">Patient</p>
              <p className="text-sm text-ink-soft border border-border rounded-lg px-3.5 py-3 bg-white">
                {patient.name} · {patient.condition}
              </p>
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

            <Button onClick={handleContinueToPayment} disabled={pending} className="w-fit">
              {pending ? "Creating booking…" : "Continue to Payment →"}
            </Button>
          </div>
        )}

        {step === 2 && result && (
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
          <p className="text-sm text-ink-soft">
            {window?.shifts ?? 1} day{(window?.shifts ?? 1) > 1 ? "s" : ""} × ₹
            {nurse.pricePerDay}
          </p>
          <p className="text-xl font-semibold text-ink">₹{totalPrice}</p>
        </Card>
      </div>
    </div>
  );
}
