import dayjs from "dayjs";

export type TripProgress = {
  currentDay: number;
  totalDays: number;
  percentage: number;
};

export function getTripProgress(
  startDate: string,
  endDate: string,
  referenceDate: string | Date = new Date(),
): TripProgress | null {
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");
  const reference = dayjs(referenceDate).startOf("day");

  if (
    !start.isValid() ||
    !end.isValid() ||
    !reference.isValid() ||
    end.isBefore(start, "day")
  ) {
    return null;
  }

  const totalDays = end.diff(start, "day") + 1;
  const elapsedDays = reference.diff(start, "day") + 1;
  const currentDay = Math.min(Math.max(elapsedDays, 1), totalDays);

  return {
    currentDay,
    totalDays,
    percentage: Math.round((currentDay / totalDays) * 100),
  };
}
