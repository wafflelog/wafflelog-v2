import dayjs from "dayjs";

import { type Pin, type PinMetadata } from "@/types/pin";

export const EMPTY_PIN_METADATA: PinMetadata = { version: 1 };

export const buildTransportMetadata = (input: {
  departure: string;
  destination: string;
  carrier: string;
  reference: string;
}): PinMetadata => ({
  version: 1,
  departure: input.departure.trim() || undefined,
  destination: input.destination.trim() || undefined,
  carrier: input.carrier.trim() || undefined,
  reference: input.reference.trim() || undefined,
});

export const getPinTimeLabelForDate = (
  pin: Pick<Pin, "startDate" | "startTime" | "endDate" | "endTime" | "allDay">,
  date: string,
) => {
  if (pin.allDay) {
    return "Full day";
  }

  const selectedDate = dayjs(date);
  const isStartDay = selectedDate.isSame(dayjs(pin.startDate), "day");
  const isEndDay = selectedDate.isSame(dayjs(pin.endDate), "day");

  if (isStartDay) {
    return pin.startTime ?? "Full day";
  }

  if (isEndDay) {
    return pin.endTime ? `Ends ${pin.endTime}` : "Full day";
  }

  return "Full day";
};

export const getPinHeaderTimeLabel = (
  pin: Pick<Pin, "startDate" | "startTime" | "endDate" | "endTime" | "allDay">,
) => {
  if (pin.startDate === pin.endDate) {
    return getPinTimeLabelForDate(pin, pin.startDate);
  }

  if (pin.allDay) {
    return `${dayjs(pin.startDate).format("DD MMM")} - ${dayjs(pin.endDate).format("DD MMM")}`;
  }

  const start = pin.startTime ? `${pin.startDate} ${pin.startTime}` : pin.startDate;
  const end = pin.endTime ? `${pin.endDate} ${pin.endTime}` : pin.endDate;
  return `${start} - ${end}`;
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
