import dayjs from "dayjs";

export const MAX_TRIP_DURATION_DAYS = 120;
export const TRIP_DURATION_LIMIT_MESSAGE = `Trips can be up to ${MAX_TRIP_DURATION_DAYS} days long.`;

export type TripProgress = {
  currentDay: number;
  totalDays: number;
  percentage: number;
};

export function getTripDurationDays(startDate: string, endDate: string) {
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (!start.isValid() || !end.isValid() || end.isBefore(start, "day")) {
    return null;
  }

  return end.diff(start, "day") + 1;
}

export function getInitialTripDayIndex(
  startDate: string,
  endDate: string,
  referenceDate: string | Date = new Date(),
) {
  const durationDays = getTripDurationDays(startDate, endDate);
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");
  const reference = dayjs(referenceDate).startOf("day");

  if (
    durationDays === null ||
    !reference.isValid() ||
    reference.isBefore(start, "day") ||
    reference.isAfter(end, "day")
  ) {
    return 0;
  }

  return reference.diff(start, "day");
}

export function getTripProgress(
  startDate: string,
  endDate: string,
  referenceDate: string | Date = new Date(),
): TripProgress | null {
  const totalDays = getTripDurationDays(startDate, endDate);
  const start = dayjs(startDate).startOf("day");
  const reference = dayjs(referenceDate).startOf("day");

  if (totalDays === null || !reference.isValid()) {
    return null;
  }

  const elapsedDays = reference.diff(start, "day") + 1;
  const currentDay = Math.min(Math.max(elapsedDays, 1), totalDays);

  return {
    currentDay,
    totalDays,
    percentage: Math.round((currentDay / totalDays) * 100),
  };
}
