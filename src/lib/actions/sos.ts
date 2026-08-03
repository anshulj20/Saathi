"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendSOSAlert } from "@/lib/notify";

export async function triggerSosAction(bookingId: string) {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found.");

  let triggeredBy: "nurse" | "customer";
  let route: "emergency_services" | "caregiver_emergency_contact";
  let recipient: string;

  if (booking.nurseUserId === user.id) {
    triggeredBy = "nurse";
    route = "emergency_services";
    recipient = "Emergency services";
  } else if (booking.customerUserId === user.id) {
    triggeredBy = "customer";
    route = "caregiver_emergency_contact";
    const contact = await prisma.emergencyContact.findFirst({
      where: { customerUserId: user.id },
    });
    recipient = contact?.name ?? "your registered emergency contact";
  } else {
    throw new Error("Not authorized for this booking.");
  }

  await prisma.sosEvent.create({ data: { bookingId, triggeredBy, route } });
  await sendSOSAlert(bookingId, { triggeredBy, route, recipient });

  return { route, recipient };
}
