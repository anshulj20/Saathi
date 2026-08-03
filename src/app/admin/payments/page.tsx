import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ConfirmPaymentButton } from "@/components/admin/confirm-payment-button";

export default async function AdminPaymentsPage() {
  await requireUser("admin");

  const refs = await prisma.paymentReference.findMany({
    where: { status: "awaiting_confirmation" },
    include: { booking: { include: { customer: true, nurse: true } } },
    orderBy: { id: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-6">
        Payments awaiting confirmation
      </h1>

      {refs.length === 0 && (
        <p className="text-muted">No payments waiting on confirmation.</p>
      )}

      <div className="flex flex-col gap-3">
        {refs.map((r) => (
          <Card key={r.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold text-ink">
                {r.qrReferenceCode}
              </p>
              <p className="text-sm text-muted">
                {r.booking.customer.name} → {r.booking.nurse.name} ·{" "}
                {r.booking.startTime.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <ConfirmPaymentButton paymentReferenceId={r.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}
