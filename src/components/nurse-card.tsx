import Link from "next/link";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { buttonClasses } from "@/lib/ui";

export function NurseCard({
  id,
  name,
  specializations,
  experienceYears,
  ratingAvg,
  ratingCount,
  pricePerDay,
  profileHref,
}: {
  id: string;
  name: string;
  specializations: string[];
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  pricePerDay: number;
  profileHref?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink text-lg">{name}</h3>
        <VerifiedBadge />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {specializations.map((s) => (
          <span
            key={s}
            className="text-xs bg-primary-tint text-primary-darker rounded-full px-2.5 py-1"
          >
            {s}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted">{experienceYears} yrs experience</p>
      <StarRatingDisplay value={ratingAvg} count={ratingCount} />
      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="font-semibold text-ink">₹{pricePerDay}</p>
          <p className="text-xs text-muted">per 8-hr shift</p>
        </div>
        <Link
          href={profileHref ?? `/nurse/${id}`}
          className={buttonClasses("outline", "sm")}
        >
          View Profile
        </Link>
      </div>
    </Card>
  );
}
