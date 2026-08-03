import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/booking";
import { SosButton } from "@/components/booking/sos-button";
import { RatingForm } from "@/components/booking/rating-form";
import { ShiftControls } from "@/components/booking/shift-controls";
import { CancelMenu } from "@/components/booking/cancel-menu";
import { ReassignmentResponse } from "@/components/booking/reassignment-response";

function fmtRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { include: { customerProfile: true } },
      nurse: true,
      patientProfile: true,
      paymentReference: true,
      rating: true,
    },
  });

  if (!booking) notFound();
  const isCustomer = booking.customerUserId === user.id;
  const isNurse = booking.nurseUserId === user.id;
  if (!isCustomer && !isNurse) notFound();

  const statusBadge = (
    <Badge tone={STATUS_TONES[booking.status]}>
      {STATUS_LABELS[booking.status]}
    </Badge>
  );

  if (isCustomer) {
    let qrDataUrl: string | null = null;
    if (booking.status === "pending_payment" && booking.paymentReference) {
      qrDataUrl = await QRCode.toDataURL(booking.paymentReference.qrReferenceCode);
    }

    return (
      <div className="max-w-2xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        <div>
          <Link href="/bookings" className="text-sm text-primary-dark font-medium">
            ← My Bookings
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">
              {booking.nurse.name}
            </h1>
            <VerifiedBadge />
          </div>
          {statusBadge}
        </div>
        <p className="text-sm text-muted -mt-4">
          {fmtRange(booking.startTime, booking.endTime)} · Booking ID{" "}
          {booking.id.slice(0, 8).toUpperCase()}
        </p>

        {booking.status === "reassignment_pending" && (
          <Card className="bg-danger-tint border-danger/20">
            <p className="text-sm text-danger font-medium">
              Your nurse cancelled this booking. We&apos;re finding a
              replacement and will notify you shortly.
            </p>
          </Card>
        )}

        {booking.status === "reassignment_offered" && (
          <ReassignmentResponse
            bookingId={booking.id}
            nurseId={booking.nurseUserId}
            nurseName={booking.nurse.name}
          />
        )}

        {booking.status === "pending_payment" && qrDataUrl && (
          <Card className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="UPI QR code" className="w-40 h-40" />
            <p className="text-sm text-muted">Scan with any UPI app</p>
            <p className="text-xs text-muted font-mono">
              UPI Ref: {booking.paymentReference?.qrReferenceCode}
            </p>
            <p className="text-xs text-muted">
              Payment is confirmed manually — this usually takes a few
              minutes.
            </p>
          </Card>
        )}

        {(booking.status === "confirmed" || booking.status === "in_progress") && (
          <Card className="flex flex-col gap-4">
            <p className="font-medium text-ink">
              {booking.status === "in_progress"
                ? `${booking.nurse.name.split(" ")[0]} is on duty`
                : `${booking.nurse.name.split(" ")[0]} will arrive on ${booking.startTime.toLocaleString(
                    undefined,
                    { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
                  )}`}
            </p>
            {booking.status === "in_progress" && booking.actualStartAt && (
              <ShiftControls
                bookingId={booking.id}
                status={booking.status}
                actualStartAt={booking.actualStartAt.toISOString()}
              />
            )}
            <div className="flex items-center gap-3">
              <a
                href={`tel:${booking.nurse.phone}`}
                className="text-sm font-semibold text-primary-dark"
              >
                Call
              </a>
              <a
                href={`sms:${booking.nurse.phone}`}
                className="text-sm font-semibold text-primary-dark"
              >
                Message
              </a>
            </div>
          </Card>
        )}

        {(booking.status === "confirmed" || booking.status === "in_progress") && (
          <div>
            <h2 className="font-semibold text-ink mb-2">
              In case of emergency
            </h2>
            <SosButton
              bookingId={booking.id}
              helperText="This alerts your registered emergency contact immediately — not Saathi support."
            />
          </div>
        )}

        <details className="text-sm text-muted">
          <summary className="cursor-pointer font-medium text-ink-soft">
            View care instructions I shared
          </summary>
          <p className="mt-2 whitespace-pre-wrap">{booking.careInstructions}</p>
        </details>

        {booking.status === "completed" && !booking.rating && (
          <Card>
            <RatingForm bookingId={booking.id} />
          </Card>
        )}
        {booking.status === "completed" && booking.rating && (
          <Card>
            <p className="font-medium text-ink mb-1">
              You rated this nurse {booking.rating.stars} / 5
            </p>
            {booking.rating.feedbackText && (
              <p className="text-sm text-muted">{booking.rating.feedbackText}</p>
            )}
          </Card>
        )}

        <p className="text-xs text-muted text-center">
          Need to cancel or report an issue?{" "}
          <Link href="/support" className="text-primary-dark font-medium">
            Contact Saathi Support
          </Link>
          .
        </p>
      </div>
    );
  }

  // Nurse view — Patient Card
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-sm text-primary-dark font-medium">
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Shift with {booking.customer.name.split(" ")[0]}&apos;s household
        </h1>
        {statusBadge}
      </div>
      <p className="text-sm text-muted -mt-4">
        {fmtRange(booking.startTime, booking.endTime)}
      </p>

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-ink">Household location</p>
          <p className="text-sm text-muted">
            {booking.customer.customerProfile?.locationText} (exact address
            shared after confirmation)
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Patient condition</p>
          <p className="text-sm text-muted">
            {booking.patientProfile.conditionSummary}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Care instructions</p>
          <p className="text-sm text-muted whitespace-pre-wrap">
            {booking.careInstructions}
          </p>
        </div>
      </Card>

      {(booking.status === "confirmed" || booking.status === "in_progress") && (
        <ShiftControls
          bookingId={booking.id}
          status={booking.status}
          actualStartAt={booking.actualStartAt?.toISOString() ?? null}
        />
      )}

      {(booking.status === "confirmed" || booking.status === "in_progress") && (
        <div>
          <h2 className="font-semibold text-ink mb-2">
            Emergency during this shift?
          </h2>
          <SosButton
            bookingId={booking.id}
            helperText="Routes directly to emergency services — not to Saathi or the family."
          />
        </div>
      )}

      {booking.status === "confirmed" && <CancelMenu bookingId={booking.id} />}

      <p className="text-xs text-muted text-center">
        Need help? Contact Saathi Support (phone/WhatsApp).
      </p>
    </div>
  );
}
