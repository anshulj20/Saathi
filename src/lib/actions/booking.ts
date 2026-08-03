"use server";

import * as z from "zod";
import QRCode from "qrcode";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  MIN_NOTICE_HOURS,
  MIN_DURATION_HOURS,
  MAX_DURATION_HOURS,
  computeBookingWindow,
  computePrice,
} from "@/lib/booking";

const schema = z.object({
  nurseId: z.string().min(1),
  startTime: z.string().min(1),
  duration: z.string().min(1),
  careInstructions: z.string().trim().min(1, { error: "Care instructions are required." }),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactRelation: z.string().trim().optional(),
});

export type CreateBookingResult =
  | { error: string }
  | {
      bookingId: string;
      qrDataUrl: string;
      referenceCode: string;
      totalPrice: number;
    };

export async function createBookingAction(
  formData: FormData
): Promise<CreateBookingResult> {
  const user = await requireUser("customer");
  if (user.status !== "active") {
    return { error: "Your account is awaiting verification by the Saathi team." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }
  const data = parsed.data;

  const startTime = new Date(data.startTime);
  if (Number.isNaN(startTime.getTime())) {
    return { error: "Invalid start date/time." };
  }

  const window = computeBookingWindow(startTime, data.duration);
  if (!window) return { error: "Invalid duration." };
  if (
    window.hours < MIN_DURATION_HOURS ||
    window.hours > MAX_DURATION_HOURS
  ) {
    return { error: "Duration must be between 2 hours and 3 days." };
  }

  const minStart = new Date(Date.now() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
  if (startTime < minStart) {
    return { error: "Bookings need at least 8 hours' notice." };
  }

  const nurse = await prisma.nurseProfile.findUnique({
    where: { userId: data.nurseId },
    include: { user: true },
  });
  if (!nurse || nurse.user.status !== "active") {
    return { error: "This nurse is not available for booking." };
  }

  const patientProfile = await prisma.patientProfile.findUnique({
    where: { customerUserId: user.id },
  });
  if (!patientProfile) {
    return { error: "Your account is missing patient details — contact Saathi Support." };
  }

  const existingContact = await prisma.emergencyContact.findFirst({
    where: { customerUserId: user.id },
  });
  if (!existingContact) {
    if (!data.contactName || !data.contactPhone || !data.contactRelation) {
      return { error: "An emergency contact is required before booking." };
    }
    await prisma.emergencyContact.create({
      data: {
        customerUserId: user.id,
        name: data.contactName,
        phone: data.contactPhone,
        relation: data.contactRelation,
      },
    });
  }

  const totalPrice = computePrice(Number(nurse.pricePerDay), data.duration);
  const referenceCode = `SAATHI-${randomBytes(4).toString("hex").toUpperCase()}`;

  const booking = await prisma.booking.create({
    data: {
      customerUserId: user.id,
      nurseUserId: data.nurseId,
      patientProfileId: patientProfile.id,
      startTime,
      endTime: window.endTime,
      careInstructions: data.careInstructions,
      status: "pending_payment",
      paymentReference: {
        create: { qrReferenceCode: referenceCode, status: "awaiting_confirmation" },
      },
    },
  });

  const qrDataUrl = await QRCode.toDataURL(referenceCode);

  return { bookingId: booking.id, qrDataUrl, referenceCode, totalPrice };
}
