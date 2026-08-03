"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  DAY_BLOCKS,
  AVAILABILITY_WINDOW_DAYS,
  startOfDay,
  blockWindow,
} from "@/lib/availability";

export async function saveAvailabilityAction(desiredKeys: string[]) {
  const user = await requireUser("nurse");

  const todayStart = startOfDay(new Date());
  const weekEnd = new Date(
    todayStart.getTime() + AVAILABILITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const [existing, bookings] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: {
        nurseUserId: user.id,
        status: "available",
        startTime: { gte: todayStart, lt: weekEnd },
      },
    }),
    prisma.booking.findMany({
      where: {
        nurseUserId: user.id,
        status: { in: ["confirmed", "in_progress"] },
        startTime: { lt: weekEnd },
        endTime: { gt: todayStart },
      },
    }),
  ]);

  const desiredSet = new Set(desiredKeys);
  const toCreate: { startTime: Date; endTime: Date }[] = [];
  const toDeleteIds: string[] = [];

  for (let day = 0; day < AVAILABILITY_WINDOW_DAYS; day++) {
    const dayStart = new Date(todayStart.getTime() + day * 24 * 60 * 60 * 1000);
    for (const block of DAY_BLOCKS) {
      const key = `${day}-${block.key}`;
      const { start, end } = blockWindow(dayStart, block);

      const isBooked = bookings.some(
        (b) => b.startTime < end && b.endTime > start
      );
      if (isBooked) continue; // locked — can't be changed here regardless of request

      const existingSlot = existing.find(
        (s) => s.startTime.getTime() === start.getTime() && s.endTime.getTime() === end.getTime()
      );
      const wantAvailable = desiredSet.has(key);

      if (wantAvailable && !existingSlot) {
        toCreate.push({ startTime: start, endTime: end });
      } else if (!wantAvailable && existingSlot) {
        toDeleteIds.push(existingSlot.id);
      }
    }
  }

  await prisma.$transaction([
    ...(toDeleteIds.length
      ? [prisma.availabilitySlot.deleteMany({ where: { id: { in: toDeleteIds } } })]
      : []),
    ...toCreate.map((slot) =>
      prisma.availabilitySlot.create({
        data: { nurseUserId: user.id, status: "available", ...slot },
      })
    ),
  ]);
}
