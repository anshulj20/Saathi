"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function submitRatingAction(
  bookingId: string,
  stars: number,
  feedbackText: string
) {
  const user = await requireUser("customer");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerUserId !== user.id) {
    throw new Error("Not authorized for this booking.");
  }
  if (booking.status !== "completed") {
    throw new Error("This booking isn't completed yet.");
  }
  if (stars < 1 || stars > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rating.create({
      data: {
        bookingId,
        nurseUserId: booking.nurseUserId,
        stars,
        feedbackText: feedbackText.trim() || null,
      },
    });

    const agg = await tx.rating.aggregate({
      where: { nurseUserId: booking.nurseUserId },
      _avg: { stars: true },
      _count: { stars: true },
    });

    await tx.nurseProfile.update({
      where: { userId: booking.nurseUserId },
      data: {
        ratingAvg: agg._avg.stars ?? 0,
        ratingCount: agg._count.stars,
      },
    });
  });
}
