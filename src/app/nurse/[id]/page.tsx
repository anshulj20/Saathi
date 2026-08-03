import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { VerifiedBadge } from "@/components/ui/badge";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Card } from "@/components/ui/card";
import { TrackProfileViewed } from "@/components/track-event";
import { BookNowWidget } from "./book-now-widget";
import { suggestedBookableStart, toDateInputValue, toTimeInputValue } from "@/lib/booking";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function NurseProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser("customer");
  const { id } = await params;
  const { date } = await searchParams;

  if (user.status !== "active") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
            Your account is awaiting verification
          </h1>
          <p className="text-muted">
            You&apos;ll be able to view nurse profiles once the Saathi team
            has verified your account.
          </p>
        </Card>
      </div>
    );
  }

  const nurse = await prisma.nurseProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });

  if (!nurse || nurse.user.status !== "active") notFound();

  const todayStart = startOfDay(new Date());
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [slots, bookings, ratings] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: {
        nurseUserId: id,
        status: "available",
        startTime: { lt: weekEnd },
        endTime: { gt: todayStart },
      },
    }),
    prisma.booking.findMany({
      where: {
        nurseUserId: id,
        status: { in: ["confirmed", "in_progress"] },
        startTime: { lt: weekEnd },
        endTime: { gt: todayStart },
      },
    }),
    prisma.rating.findMany({
      where: { nurseUserId: id, feedbackText: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { booking: { include: { customer: true } } },
    }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(todayStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const overlaps = (s: Date, e: Date) => s < dayEnd && e > dayStart;

    const booked = bookings.some((b) => overlaps(b.startTime, b.endTime));
    const available = slots.some((s) => overlaps(s.startTime, s.endTime));

    return {
      label: DAY_LABELS[dayStart.getDay()],
      status: booked ? "Booked" : available ? "Available" : "Unavailable",
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full">
      <TrackProfileViewed nurseId={id} />
      <Link href="/search" className="text-sm text-primary-dark font-medium">
        ← Back to search
      </Link>

      <div className="grid md:grid-cols-[1fr_320px] gap-10 mt-4">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-3xl font-semibold text-ink">
                {nurse.user.name}
              </h1>
              <VerifiedBadge />
            </div>
            <p className="text-muted">
              {nurse.experienceYears} years experience
            </p>
            <div className="mt-1">
              <StarRatingDisplay
                value={Number(nurse.ratingAvg)}
                count={nurse.ratingCount}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {nurse.specializations.map((s) => (
              <span
                key={s}
                className="text-sm bg-primary-tint text-primary-darker rounded-full px-3 py-1"
              >
                {s}
              </span>
            ))}
          </div>

          {nurse.bio && (
            <div>
              <h2 className="font-semibold text-ink mb-2">
                About {nurse.user.name.split(" ")[0]}
              </h2>
              <p className="text-ink-soft leading-relaxed">{nurse.bio}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-ink mb-3">
              Availability this week
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-2 text-center"
                >
                  <p className="text-xs text-muted mb-1">{d.label}</p>
                  <p
                    className={
                      d.status === "Available"
                        ? "text-xs font-semibold text-success"
                        : d.status === "Booked"
                        ? "text-xs font-semibold text-danger"
                        : "text-xs text-muted"
                    }
                  >
                    {d.status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {ratings.length > 0 && (
            <div>
              <h2 className="font-semibold text-ink mb-3">
                What families say ({nurse.ratingCount} reviews)
              </h2>
              <div className="flex flex-col gap-4">
                {ratings.map((r) => (
                  <div key={r.id} className="border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink text-sm">
                        {r.booking.customer.name.split(" ")[0]}{" "}
                        {r.booking.customer.name.split(" ")[1]?.[0]}.
                      </p>
                      <p className="text-primary text-sm">
                        {"★".repeat(r.stars)}
                        {"☆".repeat(5 - r.stars)}
                      </p>
                    </div>
                    {r.feedbackText && (
                      <p className="text-sm text-muted mt-1">
                        {r.feedbackText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <BookNowWidget
            nurseId={id}
            pricePerDay={Number(nurse.pricePerDay)}
            gender={nurse.gender}
            initialDate={date || toDateInputValue(suggestedBookableStart())}
            initialTime={toTimeInputValue(suggestedBookableStart())}
          />
        </div>
      </div>
    </div>
  );
}
