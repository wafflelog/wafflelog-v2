import { type AiPlannerPlanViewModel } from "@/types/ai-trip-planner";
import dayjs from "dayjs";

import { type PlanningResult } from "./types";

type PlanPreviewCategory =
  AiPlannerPlanViewModel["days"][number]["items"][number]["category"];

export type PlanningResultPreviewInput = {
  result: PlanningResult;
  revisionNumber: number;
  startDate?: string | null;
};

const CATEGORY_ALIASES: Record<string, PlanPreviewCategory> = {
  attraction: "attraction",
  culture: "attraction",
  cultural: "attraction",
  history: "attraction",
  landmark: "attraction",
  museum: "attraction",
  food: "food",
  drink: "food",
  restaurant: "food",
  dining: "food",
  cafe: "food",
  nature: "nature",
  outdoors: "nature",
  park: "nature",
  hike: "nature",
  transport: "transport",
  transit: "transport",
  travel: "transport",
};

function getPreviewCategory(
  type: PlanningResult["days"][number]["items"][number]["type"],
  category: string | null,
): PlanPreviewCategory {
  const normalizedCategory = category?.trim().toLowerCase();

  if (normalizedCategory && CATEGORY_ALIASES[normalizedCategory]) {
    return CATEGORY_ALIASES[normalizedCategory];
  }

  if (type === "meal") {
    return "food";
  }

  if (type === "transport") {
    return "transport";
  }

  if (type === "place") {
    return "attraction";
  }

  return "other";
}

function getValidStartDate(startDate?: string | null) {
  if (!startDate) {
    return null;
  }

  const parsedStartDate = dayjs(startDate);
  return parsedStartDate.isValid() ? parsedStartDate : null;
}

function getDateRange(startDate: string | null | undefined, durationDays: number) {
  const parsedStartDate = getValidStartDate(startDate);
  const durationLabel = `${durationDays} ${durationDays === 1 ? "day" : "days"}`;

  if (!parsedStartDate) {
    return durationLabel;
  }

  const endDate = parsedStartDate.add(durationDays - 1, "day");
  let rangeLabel: string;

  if (parsedStartDate.isSame(endDate, "month")) {
    rangeLabel = `${parsedStartDate.format("D")}–${endDate.format("D MMM")}`;
  } else if (parsedStartDate.isSame(endDate, "year")) {
    rangeLabel = `${parsedStartDate.format("D MMM")}–${endDate.format("D MMM")}`;
  } else {
    rangeLabel = `${parsedStartDate.format("D MMM YYYY")}–${endDate.format("D MMM YYYY")}`;
  }

  return `${rangeLabel} · ${durationLabel}`;
}

function getDayLabel(dayNumber: number, startDate?: string | null) {
  const baseLabel = `Day ${dayNumber}`;
  const parsedStartDate = getValidStartDate(startDate);

  if (!parsedStartDate) {
    return baseLabel;
  }

  const dayDate = parsedStartDate.add(dayNumber - 1, "day");
  return `${baseLabel} · ${dayDate.format("ddd D MMM")}`;
}

/**
 * Converts an immutable API planning result into the current draft-preview
 * view model. Import-only data remains on the original PlanningResult.
 */
export function adaptPlanningResultToPlanPreview({
  result,
  revisionNumber,
  startDate,
}: PlanningResultPreviewInput): AiPlannerPlanViewModel {
  return {
    revision: revisionNumber,
    title: result.title,
    destination: [result.destination.name, result.destination.country]
      .filter(Boolean)
      .join(", "),
    dateRange: getDateRange(startDate, result.durationDays),
    summary: result.summary,
    assumptions: [...result.assumptions],
    warnings: [...result.warnings],
    checklist: result.checklistSuggestions.map((suggestion) => suggestion.title),
    days: result.days.map((day) => ({
      id: `day-${day.dayNumber}`,
      label: getDayLabel(day.dayNumber, startDate),
      title: day.title,
      summary: day.description,
      items: day.items.map((item) => ({
        id: item.draftId,
        time: item.suggestedStartTime?.trim() || "Flexible",
        title: item.title,
        description: item.description,
        category: getPreviewCategory(item.type, item.category),
        reason: item.reason,
        sources: item.sources.map((source) => ({ ...source })),
      })),
    })),
  };
}
