import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Mocked notification sink for MVP1 — logs to notifications_log + console
// instead of dispatching a real SMS/WhatsApp/call. Swap the body of `log()`
// for a real provider (Twilio, WhatsApp Business API) later without touching
// call sites.

async function log(
  type: string,
  bookingId: string | null,
  payload: Prisma.InputJsonValue
) {
  console.log(`[notify] ${type}`, { bookingId, payload });
  await prisma.notificationLog.create({
    data: { type, bookingId, payload },
  });
}

export async function sendBookingConfirmation(
  bookingId: string,
  payload: {
    nurseName: string;
    customerName: string;
    startTime: string;
    endTime: string;
  }
) {
  await log("booking_confirmation", bookingId, payload);
}

export async function sendSOSAlert(
  bookingId: string,
  payload: {
    triggeredBy: "nurse" | "customer";
    route: "emergency_services" | "caregiver_emergency_contact";
    recipient: string;
  }
) {
  await log("sos_alert", bookingId, payload);
}
