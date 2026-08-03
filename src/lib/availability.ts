export const DAY_BLOCKS = [
  { key: "morning", label: "Morning", startHour: 6, endHour: 12 },
  { key: "afternoon", label: "Afternoon", startHour: 12, endHour: 18 },
  { key: "evening", label: "Evening", startHour: 18, endHour: 22 },
  { key: "night", label: "Night", startHour: 22, endHour: 30 }, // wraps to 6am next day
] as const;

export type DayBlockKey = (typeof DAY_BLOCKS)[number]["key"];

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function blockWindow(
  dayStart: Date,
  block: (typeof DAY_BLOCKS)[number]
) {
  const start = new Date(dayStart.getTime() + block.startHour * 60 * 60 * 1000);
  const end = new Date(dayStart.getTime() + block.endHour * 60 * 60 * 1000);
  return { start, end };
}

export const AVAILABILITY_WINDOW_DAYS = 7;
