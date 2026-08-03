import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma, Gender } from "@/generated/prisma/client";
import { SPECIALIZATIONS, GENDERS } from "@/lib/constants";
import { NurseCard } from "@/components/nurse-card";
import { TrackSearchPerformed } from "@/components/track-event";
import { Card } from "@/components/ui/card";
import { Select, Input, Label } from "@/components/ui/form";
import { buttonClasses } from "@/lib/ui";
import { toDateInputValue } from "@/lib/booking";

type SearchParams = {
  specialization?: string;
  location?: string;
  gender?: string;
  from?: string;
  till?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("customer");
  const params = await searchParams;

  if (user.status !== "active") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
            Your account is awaiting verification
          </h1>
          <p className="text-muted">
            The Saathi team manually verifies every account before you can
            search and book nurses. We&apos;ll let you know as soon as
            you&apos;re approved.
          </p>
        </Card>
      </div>
    );
  }

  const today = toDateInputValue(new Date());
  const fromValue = params.from || today;
  const tillValue = params.till || fromValue;
  const hasRange = Boolean(params.from && params.till);

  const rangeStart = new Date(`${fromValue}T00:00:00`);
  const rangeEnd = new Date(`${tillValue}T23:59:59.999`);
  const validRange =
    !Number.isNaN(rangeStart.getTime()) &&
    !Number.isNaN(rangeEnd.getTime()) &&
    rangeStart <= rangeEnd;

  const where: Prisma.NurseProfileWhereInput = {
    user: { status: "active" },
  };
  if (params.specialization) {
    where.specializations = { has: params.specialization };
  }
  if (params.location) {
    where.locationText = { contains: params.location, mode: "insensitive" };
  }
  if (params.gender && params.gender in Gender) {
    where.gender = params.gender as Gender;
  }

  let nurses: Prisma.NurseProfileGetPayload<{ include: { user: true } }>[] = [];

  if (hasRange && validRange) {
    const candidates = await prisma.nurseProfile.findMany({
      where,
      include: { user: true },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    });

    const candidateIds = candidates.map((c) => c.userId);

    const [availableSlots, blockingBookings] = await Promise.all([
      prisma.availabilitySlot.findMany({
        where: {
          nurseUserId: { in: candidateIds },
          status: "available",
          startTime: { lt: rangeEnd },
          endTime: { gt: rangeStart },
        },
        select: { nurseUserId: true },
      }),
      prisma.booking.findMany({
        where: {
          nurseUserId: { in: candidateIds },
          status: { in: ["confirmed", "in_progress"] },
          startTime: { lt: rangeEnd },
          endTime: { gt: rangeStart },
        },
        select: { nurseUserId: true },
      }),
    ]);

    const availableNurseIds = new Set(availableSlots.map((s) => s.nurseUserId));
    const bookedNurseIds = new Set(blockingBookings.map((b) => b.nurseUserId));

    nurses = candidates.filter(
      (c) => availableNurseIds.has(c.userId) && !bookedNurseIds.has(c.userId)
    );
  }

  const dep = JSON.stringify(params);
  const profileParams = hasRange ? `?date=${fromValue}` : "";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full">
      <TrackSearchPerformed dep={dep} />
      <h1 className="font-serif text-3xl font-semibold text-ink mb-6">
        Find a nurse
      </h1>

      <form
        method="GET"
        className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-white border border-border rounded-xl p-5"
      >
        <div>
          <Label htmlFor="from">Needed from</Label>
          <Input id="from" name="from" type="date" defaultValue={fromValue} required />
        </div>
        <div>
          <Label htmlFor="till">Needed till</Label>
          <Input id="till" name="till" type="date" defaultValue={tillValue} required />
        </div>
        <div>
          <Label htmlFor="specialization">Specialization</Label>
          <Select
            id="specialization"
            name="specialization"
            defaultValue={params.specialization ?? ""}
          >
            <option value="">Any</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="Indiranagar"
            defaultValue={params.location ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" defaultValue={params.gender ?? ""}>
            <option value="">Any gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g[0].toUpperCase() + g.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
          <button type="submit" className={buttonClasses("primary", "md")}>
            Search
          </button>
        </div>
      </form>

      {!hasRange && (
        <p className="text-muted text-center py-16">
          Pick the dates you need care for to see nurses available then.
        </p>
      )}

      {hasRange && !validRange && (
        <p className="text-danger text-center py-16">
          &quot;Needed till&quot; can&apos;t be before &quot;needed
          from&quot; — try again.
        </p>
      )}

      {hasRange && validRange && (
        <>
          <p className="text-sm text-muted mb-4">
            {nurses.length} verified nurse{nurses.length === 1 ? "" : "s"}{" "}
            available {fromValue}
            {tillValue !== fromValue ? ` – ${tillValue}` : ""}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nurses.map((n) => (
              <NurseCard
                key={n.userId}
                id={n.userId}
                name={n.user.name}
                specializations={n.specializations}
                experienceYears={n.experienceYears}
                ratingAvg={Number(n.ratingAvg)}
                ratingCount={n.ratingCount}
                pricePerDay={Number(n.pricePerDay)}
                profileHref={`/nurse/${n.userId}${profileParams}`}
              />
            ))}
          </div>

          {nurses.length === 0 && (
            <p className="text-muted text-center py-16">
              No nurses are available in that window — try different dates
              or filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
