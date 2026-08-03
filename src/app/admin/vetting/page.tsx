import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VettingActions } from "@/components/admin/vetting-actions";

export default async function AdminVettingPage() {
  await requireUser("admin");

  const pending = await prisma.user.findMany({
    where: { status: "pending_vetting" },
    orderBy: { createdAt: "asc" },
    include: { nurseProfile: true, customerProfile: true },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-6">
        Pending vetting
      </h1>

      {pending.length === 0 && (
        <p className="text-muted">No accounts awaiting verification.</p>
      )}

      <div className="flex flex-col gap-3">
        {pending.map((u) => (
          <Card key={u.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink">{u.name}</p>
                <Badge tone="neutral">{u.role}</Badge>
              </div>
              <p className="text-sm text-muted">
                {u.email} · {u.phone}
              </p>
              {u.nurseProfile && (
                <p className="text-xs text-muted mt-1">
                  {u.nurseProfile.specializations.join(", ")} ·{" "}
                  {u.nurseProfile.experienceYears} yrs · ₹
                  {String(u.nurseProfile.pricePerDay)}/shift ·{" "}
                  {u.nurseProfile.locationText}
                </p>
              )}
              {u.customerProfile && (
                <p className="text-xs text-muted mt-1">
                  {u.customerProfile.locationText}
                </p>
              )}
            </div>
            <VettingActions userId={u.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}
