"use client";

import posthog from "posthog-js";

// Client-side event names, exactly as specified — do not rename, merge, or
// add. `account_activated` and `payment_confirmed` are server-side (see
// src/lib/posthog-server.ts) since they're admin-triggered on someone else's
// account.

export function trackSignupCompleted(role: "customer" | "nurse") {
  posthog.capture("account_signup_completed", { role });
}

export function trackSearchPerformed() {
  posthog.capture("nurse_search_performed");
}

export function trackProfileViewed(nurseId: string) {
  posthog.capture("nurse_profile_viewed", { nurseId });
}

export function trackBookingInitiated(nurseId: string) {
  posthog.capture("booking_initiated", { nurseId });
}

export function trackCareInstructionsCompleted(bookingDraftId: string) {
  posthog.capture("care_instructions_completed", { bookingDraftId });
}

export function trackPaymentQrGenerated(bookingId: string) {
  posthog.capture("payment_qr_generated", { bookingId });
}

export function trackBookingStarted(bookingId: string) {
  posthog.capture("booking_started", { bookingId });
}

export function trackBookingEnded(bookingId: string) {
  posthog.capture("booking_ended", { bookingId });
}

export function trackSosTriggered(
  route: "emergency_services" | "caregiver_emergency_contact"
) {
  posthog.capture("sos_triggered", { route });
}

export function trackRatingSubmitted(bookingId: string) {
  posthog.capture("rating_submitted", { bookingId });
}
