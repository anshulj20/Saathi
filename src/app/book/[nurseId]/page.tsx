import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "./booking-flow";
import { Card } from "@/components/ui/card";

export default async function BookPage({
  params,
}: {
  params: Promise<{ nurseId: string }>;
}) {
  const user = await requireUser("customer");
  const { nurseId } = await params;

  if (user.status !== "active") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
            Your account is awaiting verification
          </h1>
          <p className="text-muted">
            You&apos;ll be able to book nurses once the Saathi team has
            verified your account.
          </p>
        </Card>
      </div>
    );
  }

  const nurse = await prisma.nurseProfile.findUnique({
    where: { userId: nurseId },
    include: { user: true },
  });
  if (!nurse || nurse.user.status !== "active") notFound();

  const [patientProfile, contact] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { customerUserId: user.id } }),
    prisma.emergencyContact.findFirst({ where: { customerUserId: user.id } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full">
      <BookingFlow
        nurse={{
          id: nurseId,
          name: nurse.user.name,
          ratingAvg: Number(nurse.ratingAvg),
          ratingCount: nurse.ratingCount,
          pricePerDay: Number(nurse.pricePerDay),
        }}
        existingPatient={
          patientProfile
            ? {
                name: patientProfile.patientName,
                condition: patientProfile.conditionSummary,
              }
            : null
        }
        existingContact={
          contact
            ? {
                name: contact.name,
                phone: contact.phone,
                relation: contact.relation,
              }
            : null
        }
      />
    </div>
  );
}
