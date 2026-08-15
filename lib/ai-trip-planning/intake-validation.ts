import dayjs from "dayjs";

export const AI_PLANNER_DESTINATION_MAX_LENGTH = 256;
export const AI_PLANNER_DURATION_MIN_DAYS = 1;
export const AI_PLANNER_DURATION_MAX_DAYS = 30;
export const AI_PLANNER_TRIP_BRIEF_MAX_LENGTH = 4000;

export type IntakeValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export function validatePlanningDestination(
  input: string,
): IntakeValidationResult<string> {
  const destination = input.trim();

  if (!destination) {
    return {
      success: false,
      error: "Tell me where you’re thinking of going.",
    };
  }

  if (destination.length > AI_PLANNER_DESTINATION_MAX_LENGTH) {
    return {
      success: false,
      error: `Destination must be ${AI_PLANNER_DESTINATION_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { success: true, value: destination };
}

export function validatePlanningStartDate(
  input: string,
  earliestDate = dayjs().format("YYYY-MM-DD"),
): IntakeValidationResult<string> {
  const startDate = input.trim();

  if (!startDate) {
    return {
      success: false,
      error: "Choose when you’d like the trip to start.",
    };
  }

  const parsedStartDate = dayjs(startDate);
  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    parsedStartDate.isValid() &&
    parsedStartDate.format("YYYY-MM-DD") === startDate;

  if (!isValidDate) {
    return {
      success: false,
      error: "Choose a valid start date.",
    };
  }

  if (parsedStartDate.isBefore(dayjs(earliestDate), "day")) {
    return {
      success: false,
      error: "Choose today or a future date.",
    };
  }

  return { success: true, value: startDate };
}

export function validatePlanningDuration(
  input: string,
): IntakeValidationResult<number> {
  const duration = input.trim();

  if (!duration) {
    return {
      success: false,
      error: "Tell me how many days you’d like to travel for.",
    };
  }

  if (!/^\d+$/.test(duration)) {
    return {
      success: false,
      error: "Enter the duration as a whole number of days.",
    };
  }

  const durationDays = Number(duration);

  if (
    durationDays < AI_PLANNER_DURATION_MIN_DAYS ||
    durationDays > AI_PLANNER_DURATION_MAX_DAYS
  ) {
    return {
      success: false,
      error: `Choose a trip length between ${AI_PLANNER_DURATION_MIN_DAYS} and ${AI_PLANNER_DURATION_MAX_DAYS} days.`,
    };
  }

  return { success: true, value: durationDays };
}

export function validatePlanningTripBrief(
  input: string,
  maxLength = AI_PLANNER_TRIP_BRIEF_MAX_LENGTH,
): IntakeValidationResult<string> {
  const tripBrief = input.trim();

  if (!tripBrief) {
    return {
      success: false,
      error: "Tell me a little about the trip you’d enjoy.",
    };
  }

  if (tripBrief.length > maxLength) {
    return {
      success: false,
      error: `Trip brief must be ${maxLength.toLocaleString("en-GB")} characters or fewer.`,
    };
  }

  return { success: true, value: tripBrief };
}
