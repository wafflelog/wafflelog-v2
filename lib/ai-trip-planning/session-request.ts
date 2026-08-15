import { type CreatePlanningSessionRequest } from "@/lib/ai-trip-planning/types";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";

import { AI_PLANNER_TRIP_BRIEF_MAX_LENGTH } from "./intake-validation";

export const DEFAULT_PLANNING_LOCALE = "en-GB";

export function getPlanningStartDateBriefPrefix(startDate: string) {
  return `Trip start date: ${startDate}.\n\n`;
}

export function getPlanningTripBriefInputLimit(startDate: string) {
  return (
    AI_PLANNER_TRIP_BRIEF_MAX_LENGTH -
    getPlanningStartDateBriefPrefix(startDate).length
  );
}

export function getDevicePlanningLocale() {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().locale || DEFAULT_PLANNING_LOCALE
    );
  } catch {
    return DEFAULT_PLANNING_LOCALE;
  }
}

export function buildCreatePlanningSessionRequest(
  answers: AiPlannerIntakeAnswers,
  locale = getDevicePlanningLocale(),
): CreatePlanningSessionRequest {
  const tripBrief = `${getPlanningStartDateBriefPrefix(answers.startDate)}${answers.tripBrief.trim()}`;

  if (tripBrief.length > AI_PLANNER_TRIP_BRIEF_MAX_LENGTH) {
    throw new RangeError(
      `Combined trip brief must be ${AI_PLANNER_TRIP_BRIEF_MAX_LENGTH.toLocaleString("en-GB")} characters or fewer.`,
    );
  }

  return {
    destination: answers.destination.trim(),
    durationDays: answers.durationDays,
    tripBrief,
    locale,
  };
}
