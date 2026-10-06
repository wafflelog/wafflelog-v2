import {
  AI_PLANNER_DESTINATION_MAX_LENGTH,
  AI_PLANNER_TRIP_BRIEF_MAX_LENGTH,
  validatePlanningDestination,
  validatePlanningDuration,
  validatePlanningStartDate,
  validatePlanningTripBrief,
  type IntakeValidationResult,
} from "@/lib/ai-trip-planning/intake-validation";
import { getPlanningTripBriefInputLimit } from "@/lib/ai-trip-planning/session-request";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import dayjs from "dayjs";
import {
  type InputModeOptions,
  type KeyboardTypeOptions,
} from "react-native";

export type IntakeField = keyof AiPlannerIntakeAnswers;
export const AI_PLANNER_INTAKE_INPUT_ID = "ai-planner-intake-input";

type IntakeInputConfig = {
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  inputMode: InputModeOptions;
  multiline: boolean;
  suffix?: string;
  getMaxLength: (
    answers: Partial<AiPlannerIntakeAnswers>,
  ) => number | undefined;
};

type NormalizedIntakeValidationResult = IntakeValidationResult<
  string | number
>;

export const INTAKE_FIELD_ORDER: IntakeField[] = [
  "destination",
  "startDate",
  "durationDays",
  "tripBrief",
];

export const INTAKE_QUESTIONS: Record<IntakeField, string> = {
  destination:
    "Where are you thinking of going? A city, region or country is perfect.",
  startDate: "When would you like the trip to start?",
  durationDays: "How many days would you like the trip to last?",
  tripBrief:
    "What would make this a great trip for you? Tell me about your interests, pace, budget, who you’re travelling with, or anything you want to avoid.",
};

export const INTAKE_EDIT_QUESTIONS: Record<IntakeField, string> = {
  destination: "Let’s update the destination. Where are you thinking?",
  startDate: "Let’s update the start date. When would you like to go?",
  durationDays: "Let’s update the trip length. How many days would you like?",
  tripBrief: "Let’s update your ideas. What would you like me to plan around?",
};

export const INTAKE_FIELD_LABELS: Record<IntakeField, string> = {
  destination: "Destination",
  startDate: "Start date",
  durationDays: "Trip length",
  tripBrief: "Your ideas",
};

export const INTAKE_INPUT_CONFIG: Record<IntakeField, IntakeInputConfig> = {
  destination: {
    placeholder: "e.g. Osaka, Japan",
    keyboardType: "default",
    inputMode: "text",
    multiline: false,
    getMaxLength: () => AI_PLANNER_DESTINATION_MAX_LENGTH,
  },
  startDate: {
    placeholder: "Choose a start date",
    keyboardType: "default",
    inputMode: "text",
    multiline: false,
    getMaxLength: () => undefined,
  },
  durationDays: {
    placeholder: "e.g. 4",
    keyboardType: "number-pad",
    inputMode: "numeric",
    multiline: false,
    suffix: "days",
    getMaxLength: () => undefined,
  },
  tripBrief: {
    placeholder: "Share the mood, interests and constraints…",
    keyboardType: "default",
    inputMode: "text",
    multiline: true,
    getMaxLength: (answers) =>
      answers.startDate
        ? getPlanningTripBriefInputLimit(answers.startDate)
        : AI_PLANNER_TRIP_BRIEF_MAX_LENGTH,
  },
};

const INTAKE_VALIDATORS: Record<
  IntakeField,
  (
    input: string,
    answers: Partial<AiPlannerIntakeAnswers>,
  ) => NormalizedIntakeValidationResult
> = {
  destination: (input) => validatePlanningDestination(input),
  startDate: (input) => validatePlanningStartDate(input),
  durationDays: (input) => validatePlanningDuration(input),
  tripBrief: (input, answers) =>
    validatePlanningTripBrief(
      input,
      INTAKE_INPUT_CONFIG.tripBrief.getMaxLength(answers),
    ),
};

export function validateIntakeField(
  field: IntakeField,
  input: string,
  answers: Partial<AiPlannerIntakeAnswers>,
) {
  return INTAKE_VALIDATORS[field](input, answers);
}

export function formatIntakeAnswer(
  field: IntakeField,
  answers: AiPlannerIntakeAnswers,
) {
  return formatAnsweredIntakeField(field, answers);
}

export function formatAnsweredIntakeField(
  field: IntakeField,
  answers: Partial<AiPlannerIntakeAnswers>,
) {
  switch (field) {
    case "startDate":
      return answers.startDate
        ? dayjs(answers.startDate).format("D MMMM YYYY")
        : "";
    case "durationDays":
      return answers.durationDays === undefined
        ? ""
        : `${answers.durationDays} ${
            answers.durationDays === 1 ? "day" : "days"
          }`;
    case "destination":
      return answers.destination ?? "";
    case "tripBrief":
      return answers.tripBrief ?? "";
  }
}
