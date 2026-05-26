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
