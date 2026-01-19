import dayjs from "dayjs";

import { match } from "ts-pattern";

export function formatDate(date: string, format: "long" | "short" = "long") {
  return match(format)
    .with("long", () => dayjs(date).format("DD MMM YYYY"))
    .with("short", () => dayjs(date).format("DD MMM"))
    .exhaustive();
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function formatTime(time: string) {
  return dayjs(time).format("HH:mm");
}
