import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/ui";
import { AvailabilityGrid } from "@/components/dashboard/availability-grid";
import {
  DAY_BLOCKS,
  AVAILABILITY_WINDOW_DAYS,
  startOfDay,
  blockWindow,
} from "@/lib/availability";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/booking";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "availability", label: "Availability" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser("nurse");
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "upcoming";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {user.name}
          </h1>
          <p className="text-muted text-sm">Nurse</p>
        </div>
      </div>

      {user.status !== "active" && (
        <Card className="my-4 bg-danger-tint border-danger/20">
          <p className="text-sm text-danger">
            Your account is awaiting verification. You&apos;ll appear in
            customer search once the Saathi team approves your profile —
            feel free to set your availability in the meantime.
          </p>
        </Card>
      )}

      <div className="flex gap-6 border-b border-border mt-6 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard?tab=${t.key}`}
            className={cn(
              "pb-3 text-sm font-medium -mb-px border-b-2",
              tab === t.key
                ? "border-primary text-primary-dark"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "upcoming" && <UpcomingTab nurseId={user.id} />}
      {tab === "active" && <ActiveTab nurseId={user.id} />}
      {tab === "availability" && <AvailabilityTab nurseId={user.id} />}
    </div>
  );
}

async function UpcomingTab({ nurseId }: { nurseId: string }) {
  const bookings = await prisma.booking.findMany({
    where: { nurseUserId: nurseId, status: "confirmed" },
    include: { customer: true },
    orderBy: { startTime: "asc" },
  });

  if (bookings.length === 0) {
    return <p className="text-muted">No upcoming bookings yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
        <Link key={b.id} href={`/bookings/${b.id}`}>
          <Card className="flex items-center justify-between hover:border-primary transition-colors">
            <div>
              <p className="font-semibold text-ink">
                {b.customer.name.split(" ")[0]}&apos;s household
              </p>
              <p className="text-sm text-muted">
                {b.startTime.toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Badge tone={STATUS_TONES[b.status]}>{STATUS_LABELS[b.status]}</Badge>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function ActiveTab({ nurseId }: { nurseId: string }) {
  const bookings = await prisma.booking.findMany({
    where: { nurseUserId: nurseId, status: "in_progress" },
    include: { customer: true },
    orderBy: { actualStartAt: "asc" },
  });

  if (bookings.length === 0) {
    return <p className="text-muted">No active shift right now.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
        <Link key={b.id} href={`/bookings/${b.id}`}>
          <Card className="flex items-center justify-between hover:border-primary transition-colors">
            <div>
              <p className="font-semibold text-ink">
                {b.customer.name.split(" ")[0]}&apos;s household
              </p>
              <p className="text-sm text-success">● In progress</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function AvailabilityTab({ nurseId }: { nurseId: string }) {
  const todayStart = startOfDay(new Date());
  const weekEnd = new Date(
    todayStart.getTime() + AVAILABILITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const [slots, bookings] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: {
        nurseUserId: nurseId,
        status: "available",
        startTime: { gte: todayStart, lt: weekEnd },
      },
    }),
    prisma.booking.findMany({
      where: {
        nurseUserId: nurseId,
        status: { in: ["confirmed", "in_progress"] },
        startTime: { lt: weekEnd },
        endTime: { gt: todayStart },
      },
    }),
  ]);

  const days = Array.from({ length: AVAILABILITY_WINDOW_DAYS }, (_, i) => {
    const date = new Date(todayStart.getTime() + i * 24 * 60 * 60 * 1000);
    return { key: i, label: DAY_NAMES[date.getDay()], date: date.toISOString() };
  });

  const grid: Record<string, "available" | "booked" | "unavailable"> = {};
  for (const d of days) {
    const dayStart = new Date(d.date);
    for (const block of DAY_BLOCKS) {
      const { start, end } = blockWindow(dayStart, block);
      const key = `${d.key}-${block.key}`;
      const booked = bookings.some((b) => b.startTime < end && b.endTime > start);
      const available = slots.some((s) => s.startTime.getTime() === start.getTime());
      grid[key] = booked ? "booked" : available ? "available" : "unavailable";
    }
  }

  return (
    <div>
      <h2 className="font-semibold text-ink mb-4">Set your availability</h2>
      <AvailabilityGrid days={days} initialGrid={grid} />
    </div>
  );
}
