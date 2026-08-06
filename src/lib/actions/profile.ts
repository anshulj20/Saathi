"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(2, { error: "Enter your full name." }),
  phone: z
    .string()
    .trim()
    .min(8, { error: "Enter a valid phone number." })
    .max(20),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  locationText: z
    .string()
    .trim()
    .min(2, { error: "Enter your household location." }),
  patientName: z
    .string()
    .trim()
    .min(2, { error: "Enter the patient's name." }),
  conditionSummary: z
    .string()
    .trim()
    .min(2, { error: "Briefly describe the patient's condition." }),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactRelation: z.string().trim().optional(),
});

export type ProfileState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      ok?: boolean;
    }
  | undefined;

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireUser("customer");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  const hasContact = Boolean(
    data.contactName || data.contactPhone || data.contactRelation
  );
  if (
    hasContact &&
    (!data.contactName || !data.contactPhone || !data.contactRelation)
  ) {
    return {
      errors: {
        contactName: [
          "Fill in all three emergency contact fields, or leave all three blank.",
        ],
      },
    };
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
      NOT: { id: user.id },
    },
    select: { email: true, phone: true },
  });
  if (existing) {
    const errors: Record<string, string[]> = {};
    if (existing.email === data.email) {
      errors.email = ["Another account already uses this email."];
    }
    if (existing.phone === data.phone) {
      errors.phone = ["Another account already uses this phone number."];
    }
    return { errors };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { name: data.name, phone: data.phone, email: data.email },
    });

    await tx.customerProfile.upsert({
      where: { userId: user.id },
      update: { locationText: data.locationText },
      create: { userId: user.id, locationText: data.locationText },
    });

    await tx.patientProfile.upsert({
      where: { customerUserId: user.id },
      update: {
        patientName: data.patientName,
        conditionSummary: data.conditionSummary,
      },
      create: {
        customerUserId: user.id,
        patientName: data.patientName,
        conditionSummary: data.conditionSummary,
      },
    });

    if (hasContact) {
      const existingContact = await tx.emergencyContact.findFirst({
        where: { customerUserId: user.id },
      });
      if (existingContact) {
        await tx.emergencyContact.update({
          where: { id: existingContact.id },
          data: {
            name: data.contactName!,
            phone: data.contactPhone!,
            relation: data.contactRelation!,
          },
        });
      } else {
        await tx.emergencyContact.create({
          data: {
            customerUserId: user.id,
            name: data.contactName!,
            phone: data.contactPhone!,
            relation: data.contactRelation!,
          },
        });
      }
    }
  });

  return { ok: true, message: "Profile updated." };
}
