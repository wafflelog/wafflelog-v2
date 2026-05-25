import dayjs from "dayjs";

import { type Pin, type PinCategory, type PinMetadata } from "@/types/pin";

export const EMPTY_PIN_METADATA: PinMetadata = { version: 1 };

export const RANGE_PIN_CATEGORY_IDS = ["event", "stay"] as const;

export const isRangePinCategory = (categoryId: string) =>
  RANGE_PIN_CATEGORY_IDS.some((id) => id === categoryId);

export const buildTransportMetadata = (input: {
  departure: string;
  destination: string;
}): PinMetadata => ({
  version: 1,
  departure: input.departure.trim() || undefined,
  destination: input.destination.trim() || undefined,
});

export const getPinTitle = (
  pin: Pick<Pin, "name" | "category">,
) => pin.name?.trim() || pin.category.name;

export const getPinTimeLabelForDate = (
  pin: Pick<Pin, "startDate" | "endDate" | "time">,
  date: string,
) => {
  const selectedDate = dayjs(date);
  const isStartDay = selectedDate.isSame(dayjs(pin.startDate), "day");

  if (isStartDay) {
    return pin.time ?? "Full day";
  }

  return "Full day";
};

export const getPinHeaderTimeLabel = (
  pin: Pick<Pin, "startDate" | "endDate" | "time">,
) => {
  if (!pin.endDate || pin.startDate === pin.endDate) {
    return pin.time ?? dayjs(pin.startDate).format("DD MMM");
  }

  return `${dayjs(pin.startDate).format("DD MMM")} - ${dayjs(pin.endDate).format("DD MMM")}`;
};

export const getPinSubtitle = (
  pin: Pick<Pin, "category" | "metadata" | "location">,
) => {
  if (
    pin.category.id === "transport" &&
    pin.metadata.departure &&
    pin.metadata.destination
  ) {
    return `${pin.metadata.departure} -> ${pin.metadata.destination}`;
  }

  return pin.location.name === "Unknown location" ? "" : pin.location.name;
};

export const getPinFallbackName = (category: PinCategory) => category.name;
