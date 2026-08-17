import dayjs from "dayjs";
import { type ConfigType } from "dayjs";
import { Platform } from "react-native";

import { match } from "ts-pattern";

export function formatDate(date: string, format: "long" | "short" = "long") {
  return match(format)
    .with("long", () => dayjs(date).format("DD MMM YYYY"))
    .with("short", () => dayjs(date).format("DD MMM"))
    .exhaustive();
}

export function formatDateRange(startDate: string, endDate: string) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (start.isSame(end, "day")) {
    return start.format("DD MMM YYYY");
  }

  if (start.isSame(end, "month")) {
    return `${start.format("DD")}–${end.format("DD MMM YYYY")}`;
  }

  if (start.isSame(end, "year")) {
    return `${start.format("DD MMM")}–${end.format("DD MMM YYYY")}`;
  }

  return `${start.format("DD MMM YYYY")}–${end.format("DD MMM YYYY")}`;
}

export function formatTime(time: string) {
  return dayjs(time).format("HH:mm");
}

export function formatCreatedAt(
  dateTime: string,
  referenceDateTime: ConfigType = dayjs(),
) {
  const referenceDate = dayjs(referenceDateTime);
  const date = dayjs(dateTime);

  // If it's today, show hours and minutes
  if (date.isSame(referenceDate, "day")) {
    return date.format("HH:mm");
  }

  // If it's not today but same month, show date and month
  if (date.isSame(referenceDate, "month")) {
    return date.format("DD MMM");
  }

  // If it's not the same month, show month and year
  return date.format("MMM YYYY");
}

export type FontWeight = "400" | "500" | "600" | "700";

export const getFontFamily = (weight: FontWeight = "400") => {
  const fontMap = {
    "400": {
      android: "Montserrat_400Regular",
      ios: "Montserrat-Regular",
    },
    "500": {
      android: "Montserrat_500Medium",
      ios: "Montserrat-Medium",
    },
    "600": {
      android: "Montserrat_600SemiBold",
      ios: "Montserrat-SemiBold",
    },
    "700": {
      android: "Montserrat_700Bold",
      ios: "Montserrat-Bold",
    },
  };

  return Platform.select(fontMap[weight]);
};
