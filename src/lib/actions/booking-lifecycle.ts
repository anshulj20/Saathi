"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function startShiftAction(bookingId: string) {
  const user = await requireUser("nurse");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.nurseUserId !== user.id) {
    throw new Error("Not authorized for this booking.");
  }
  if (booking.status !== "confirmed") {
    throw new Error("This booking isn't ready to start.");
  }
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "in_progress", actualStartAt: new Date() },
  });
}

export async function endShiftAction(bookingId: string) {
  const user = await requireUser("nurse");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.nurseUserId !== user.id) {
    throw new Error("Not authorized for this booking.");
  }
  if (booking.status !== "in_progress") {
    throw new Error("This shift isn't active.");
  }
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "completed", actualEndAt: new Date() },
  });
}

// Not in the original tech spec (nurses don't accept/decline there — payment
// confirmation alone moves a booking to `confirmed`). Added because the
// nurse needs a way to back out of an already-confirmed booking; modelled as
// a cancellation with a reason rather than a full accept/decline step.
export async function cancelByNurseAction(bookingId: string, reason: string) {
  const user = await requireUser("nurse");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.nurseUserId !== user.id) {
    throw new Error("Not authorized for this booking.");
  }
  if (booking.status !== "confirmed") {
    throw new Error("This booking can no longer be cancelled here.");
  }
  if (!reason.trim()) {
    throw new Error("A reason is required.");
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "reassignment_pending" },
    }),
    prisma.notificationLog.create({
      data: {
        type: "booking_cancelled_by_nurse",
        bookingId,
        payload: { reason },
      },
    }),
  ]);
}

export async function respondToReassignmentAction(
  bookingId: string,
  accept: boolean
) {
  const user = await requireUser("customer");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerUserId !== user.id) {
    throw new Error("Not authorized for this booking.");
  }
  if (booking.status !== "reassignment_offered") {
    throw new Error("There's nothing to respond to on this booking.");
  }
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: accept ? "confirmed" : "cancelled" },
  });
}
