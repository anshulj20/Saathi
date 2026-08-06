import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser("customer");

  const [dbUser, customerProfile, patientProfile, contact] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    prisma.patientProfile.findUnique({ where: { customerUserId: user.id } }),
    prisma.emergencyContact.findFirst({ where: { customerUserId: user.id } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 w-full">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
        My Profile
      </h1>
      <p className="text-muted mb-8">
        Keep your details up to date — this is what nurses and Saathi see
        when you book.
      </p>
      <ProfileForm
        initial={{
          name: dbUser.name,
          phone: dbUser.phone,
          email: dbUser.email,
          locationText: customerProfile?.locationText ?? "",
          patientName: patientProfile?.patientName ?? "",
          conditionSummary: patientProfile?.conditionSummary ?? "",
          contactName: contact?.name ?? "",
          contactPhone: contact?.phone ?? "",
          contactRelation: contact?.relation ?? "",
        }}
      />
    </div>
  );
}
