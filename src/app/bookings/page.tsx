import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/booking";

export default async function BookingsPage() {
  const user = await requireUser("customer");

  const bookings = await prisma.booking.findMany({
    where: { customerUserId: user.id },
    include: { nurse: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-6">
        My Bookings
      </h1>

      {bookings.length === 0 && (
        <Card>
          <p className="text-muted">
            You haven&apos;t booked a nurse yet.{" "}
            <Link href="/search" className="text-primary-dark font-semibold">
              Search nurses →
            </Link>
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => (
          <Link key={b.id} href={`/bookings/${b.id}`}>
            <Card className="flex items-center justify-between gap-4 hover:border-primary transition-colors">
              <div>
                <p className="font-semibold text-ink">{b.nurse.name}</p>
                <p className="text-sm text-muted">
                  {b.startTime.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  –{" "}
                  {b.endTime.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <Badge tone={STATUS_TONES[b.status]}>
                {STATUS_LABELS[b.status]}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
