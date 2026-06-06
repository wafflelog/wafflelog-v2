import dayjs from "dayjs";

import { type Pin, type PinMetadata } from "@/types/pin";

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

type PinTitleInput = {
  name?: string | null;
  category?: Pick<Pin["category"], "id" | "name">;
  categoryId?: string;
  metadata?: Pick<PinMetadata, "departure" | "destination">;
  metadataJson?: Pick<PinMetadata, "departure" | "destination">;
  location?: {
    name?: string | null;
    displayName?: string | null;
  } | null;
  displayName?: string | null;
};

const UNKNOWN_LOCATION_NAME = "Unknown location";

const getTransportTitle = (
  metadata?: Pick<PinMetadata, "departure" | "destination">,
) => {
  if (metadata?.departure && metadata.destination) {
    return `${metadata.departure} -> ${metadata.destination}`;
  }

  return null;
};

export const getPinTitle = (pin: PinTitleInput) => {
  const name = pin.name?.trim();

  if (name) {
    return name;
  }

  const transportTitle =
    getTransportTitle(pin.metadata) ?? getTransportTitle(pin.metadataJson);

  if (transportTitle) {
    return transportTitle;
  }

  const locationName =
    pin.location?.name ?? pin.location?.displayName ?? pin.displayName;

  if (locationName && locationName !== UNKNOWN_LOCATION_NAME) {
    return locationName;
  }

  return pin.category?.name ?? pin.categoryId ?? "Pin";
};

export const getPinTimeLabelForDate = (
  pin: Pick<Pin, "startDate" | "endDate" | "time" | "endTime">,
  date: string,
) => {
  const selectedDate = dayjs(date);
  const isStartDay = selectedDate.isSame(dayjs(pin.startDate), "day");
  const isEndDay = pin.endDate
    ? selectedDate.isSame(dayjs(pin.endDate), "day")
    : false;
  const isMultiDayPin =
    Boolean(pin.endDate) && !dayjs(pin.startDate).isSame(dayjs(pin.endDate), "day");

  if (!isMultiDayPin) {
    if (pin.time && pin.endTime) {
      return `${pin.time} - ${pin.endTime}`;
    }

    if (pin.endTime) {
      return `ends at ${pin.endTime}`;
    }

    return pin.time ?? null;
  }

  if (isStartDay) {
    return pin.time;
  }

  if (isEndDay) {
    return pin.endTime ? `ends at ${pin.endTime}` : null;
  }

  return pin.time && pin.endTime ? "Full day" : null;
};

export const getPinHeaderTimeLabel = (
  pin: Pick<Pin, "startDate" | "endDate" | "time" | "endTime">,
) => {
  const startDateLabel = dayjs(pin.startDate).format("DD MMM");
  const endDateLabel = pin.endDate
    ? dayjs(pin.endDate).format("DD MMM")
    : startDateLabel;
  const isMultiDayPin =
    Boolean(pin.endDate) && !dayjs(pin.startDate).isSame(dayjs(pin.endDate), "day");

  if (!isMultiDayPin) {
    if (pin.time && pin.endTime) {
      return `${startDateLabel} ${pin.time} - ${pin.endTime}`;
    }

    if (pin.time) {
      return `${startDateLabel} ${pin.time}`;
    }

    if (pin.endTime) {
      return `${startDateLabel} ends at ${pin.endTime}`;
    }

    return startDateLabel;
  }

  const startLabel = pin.time
    ? `${startDateLabel} ${pin.time}`
    : startDateLabel;
  const endLabel = pin.endTime ? `${endDateLabel} ${pin.endTime}` : endDateLabel;

  return `${startLabel} - ${endLabel}`;
};

export const getPinSubtitle = (
  pin: Pick<Pin, "name" | "category" | "metadata" | "location">,
) => {
  const hasName = Boolean(pin.name?.trim());

  if (
    hasName &&
    pin.category.id === "transport" &&
    pin.metadata.departure &&
    pin.metadata.destination
  ) {
    return `${pin.metadata.departure} -> ${pin.metadata.destination}`;
  }

  return pin.location.name === UNKNOWN_LOCATION_NAME ? "" : pin.location.name;
};
