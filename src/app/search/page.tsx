import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma, Gender } from "@/generated/prisma/client";
import { SPECIALIZATIONS, GENDERS } from "@/lib/constants";
import { NurseCard } from "@/components/nurse-card";
import { TrackSearchPerformed } from "@/components/track-event";
import { Card } from "@/components/ui/card";
import { Select, Input, Label } from "@/components/ui/form";
import { buttonClasses } from "@/lib/ui";

type SearchParams = {
  specialization?: string;
  location?: string;
  gender?: string;
  maxPrice?: string;
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
  if (params.maxPrice) {
    where.pricePerDay = { lte: Number(params.maxPrice) };
  }

  const nurses = await prisma.nurseProfile.findMany({
    where,
    include: { user: true },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
  });

  const dep = JSON.stringify(params);

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
        <div>
          <Label htmlFor="maxPrice">Max price / shift</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            type="number"
            placeholder="1200"
            defaultValue={params.maxPrice ?? ""}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className={buttonClasses("primary", "md", "w-full")}>
            Search
          </button>
        </div>
      </form>

      <p className="text-sm text-muted mb-4">
        {nurses.length} verified nurse{nurses.length === 1 ? "" : "s"} match
        your search
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
          />
        ))}
      </div>

      {nurses.length === 0 && (
        <p className="text-muted text-center py-16">
          No nurses match these filters yet — try widening your search.
        </p>
      )}
    </div>
  );
}
