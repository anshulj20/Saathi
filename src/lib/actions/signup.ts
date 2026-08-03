"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { SPECIALIZATIONS, GENDERS } from "@/lib/constants";

const baseFields = {
  name: z.string().trim().min(2, { error: "Enter your full name." }),
  phone: z
    .string()
    .trim()
    .min(8, { error: "Enter a valid phone number." })
    .max(20),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
};

const customerSchema = z.object({
  role: z.literal("customer"),
  ...baseFields,
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
});

const nurseSchema = z.object({
  role: z.literal("nurse"),
  ...baseFields,
  locationText: z
    .string()
    .trim()
    .min(2, { error: "Enter the area you serve." }),
  gender: z.enum(GENDERS, { error: "Select a gender." }),
  experienceYears: z.coerce
    .number({ error: "Enter years of experience." })
    .int()
    .min(0)
    .max(60),
  pricePerDay: z.coerce
    .number({ error: "Enter a price per shift." })
    .positive({ error: "Price must be greater than 0." }),
  specializations: z
    .array(z.enum(SPECIALIZATIONS))
    .min(1, { error: "Select at least one specialization." }),
  bio: z.string().trim().optional(),
});

const signupSchema = z.discriminatedUnion("role", [customerSchema, nurseSchema]);

export type SignupState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      ok?: boolean;
      role?: "customer" | "nurse";
    }
  | undefined;

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const role = formData.get("role");

  const raw = {
    role,
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    locationText: formData.get("locationText"),
    patientName: formData.get("patientName"),
    conditionSummary: formData.get("conditionSummary"),
    gender: formData.get("gender"),
    experienceYears: formData.get("experienceYears"),
    pricePerDay: formData.get("pricePerDay"),
    specializations: formData.getAll("specializations"),
    bio: formData.get("bio") || undefined,
  };

  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
    select: { email: true, phone: true },
  });
  if (existing) {
    const errors: Record<string, string[]> = {};
    if (existing.email === data.email) {
      errors.email = ["An account with this email already exists."];
    }
    if (existing.phone === data.phone) {
      errors.phone = ["An account with this phone number already exists."];
    }
    return { errors };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        role: data.role,
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
      },
    });

    if (data.role === "customer") {
      await tx.customerProfile.create({
        data: { userId: user.id, locationText: data.locationText },
      });
      await tx.patientProfile.create({
        data: {
          customerUserId: user.id,
          patientName: data.patientName,
          conditionSummary: data.conditionSummary,
        },
      });
    } else {
      await tx.nurseProfile.create({
        data: {
          userId: user.id,
          specializations: data.specializations,
          experienceYears: data.experienceYears,
          pricePerDay: data.pricePerDay,
          gender: data.gender,
          locationText: data.locationText,
          bio: data.bio || null,
        },
      });
    }
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  return { ok: true, role: data.role };
}
