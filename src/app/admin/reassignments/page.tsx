import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { AssignReplacementForm } from "@/components/admin/assign-replacement-form";

export default async function AdminReassignmentsPage() {
  await requireUser("admin");

  const bookings = await prisma.booking.findMany({
    where: { status: "reassignment_pending" },
    include: { customer: true, nurse: true },
    orderBy: { startTime: "asc" },
  });

  const activeNurses = await prisma.nurseProfile.findMany({
    where: { user: { status: "active" } },
    include: { user: true },
  });

  const reasons = await prisma.notificationLog.findMany({
    where: {
      type: "booking_cancelled_by_nurse",
      bookingId: { in: bookings.map((b) => b.id) },
    },
    orderBy: { createdAt: "desc" },
  });
  const reasonByBooking = new Map(
    reasons.map((r) => [r.bookingId, (r.payload as { reason?: string })?.reason])
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
        Needs reassignment
      </h1>
      <p className="text-muted mb-6">
        These nurses cancelled a confirmed booking. Assign a replacement —
        the customer will be asked to accept or reject before the booking is
        confirmed again.
      </p>

      {bookings.length === 0 && (
        <p className="text-muted">Nothing needs reassignment right now.</p>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => {
          const nurseOptions = activeNurses
            .filter((n) => n.userId !== b.nurseUserId)
            .map((n) => ({ id: n.userId, name: n.user.name }));
          return (
            <Card key={b.id} className="flex flex-col gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {b.customer.name} — was booked with {b.nurse.name}
                </p>
                <p className="text-sm text-muted">
                  {b.startTime.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {reasonByBooking.get(b.id) && (
                  <p className="text-sm text-danger mt-1">
                    Cancellation reason: {reasonByBooking.get(b.id)}
                  </p>
                )}
              </div>
              {nurseOptions.length > 0 ? (
                <AssignReplacementForm bookingId={b.id} nurses={nurseOptions} />
              ) : (
                <p className="text-sm text-muted">
                  No other active nurses available to assign yet.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
