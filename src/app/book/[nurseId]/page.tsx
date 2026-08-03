import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "./booking-flow";
import { Card } from "@/components/ui/card";
import { getDurationOption } from "@/lib/booking";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ nurseId: string }>;
  searchParams: Promise<{ start?: string; duration?: string }>;
}) {
  const user = await requireUser("customer");
  const { nurseId } = await params;
  const { start, duration } = await searchParams;

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

  const startDate = start ? new Date(start) : null;
  const durationOption = duration ? getDurationOption(duration) : null;
  if (!startDate || Number.isNaN(startDate.getTime()) || !durationOption) {
    redirect(`/nurse/${nurseId}`);
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

  if (!patientProfile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
            We need patient details first
          </h1>
          <p className="text-muted">
            Your account is missing patient details. Contact Saathi Support
            and we&apos;ll add them for you.
          </p>
        </Card>
      </div>
    );
  }

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
        startTime={startDate.toISOString()}
        duration={duration!}
        patient={{
          name: patientProfile.patientName,
          condition: patientProfile.conditionSummary,
        }}
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
