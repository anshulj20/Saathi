"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendBookingConfirmation } from "@/lib/notify";
import { captureServerEvent } from "@/lib/posthog-server";

export async function activateAccountAction(userId: string) {
  await requireUser("admin");
  const target = await prisma.user.update({
    where: { id: userId },
    data: { status: "active" },
  });
  await captureServerEvent(userId, "account_activated", { role: target.role });
}

export async function rejectAccountAction(userId: string) {
  await requireUser("admin");
  await prisma.user.update({ where: { id: userId }, data: { status: "suspended" } });
}

export async function confirmPaymentAction(paymentReferenceId: string) {
  const admin = await requireUser("admin");

  const ref = await prisma.paymentReference.findUnique({
    where: { id: paymentReferenceId },
    include: { booking: { include: { customer: true, nurse: true } } },
  });
  if (!ref) throw new Error("Payment reference not found.");

  // Atomic conditional update: only the caller that flips
  // awaiting_confirmation -> confirmed proceeds. A concurrent or repeated
  // confirmation click is a no-op, not a duplicate booking/event.
  const updated = await prisma.paymentReference.updateMany({
    where: { id: ref.id, status: "awaiting_confirmation" },
    data: { status: "confirmed", confirmedByAdminId: admin.id, confirmedAt: new Date() },
  });
  if (updated.count === 0) return;

  await prisma.booking.update({
    where: { id: ref.bookingId },
    data: { status: "confirmed" },
  });

  await sendBookingConfirmation(ref.bookingId, {
    nurseName: ref.booking.nurse.name,
    customerName: ref.booking.customer.name,
    startTime: ref.booking.startTime.toISOString(),
    endTime: ref.booking.endTime.toISOString(),
  });

  await captureServerEvent(ref.booking.customerUserId, "payment_confirmed", {
    bookingId: ref.bookingId,
  });
}

export async function assignReplacementNurseAction(
  bookingId: string,
  newNurseId: string
) {
  await requireUser("admin");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found.");
  if (booking.status !== "reassignment_pending") {
    throw new Error("This booking isn't awaiting reassignment.");
  }
  const nurse = await prisma.nurseProfile.findUnique({
    where: { userId: newNurseId },
    include: { user: true },
  });
  if (!nurse || nurse.user.status !== "active") {
    throw new Error("Selected nurse is not an active account.");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { nurseUserId: newNurseId, status: "reassignment_offered" },
  });
}
