export type AiPlannerSourceViewModel = {
  title: string;
  url: string;
};

export type AiPlannerItemViewModel = {
  id: string;
  time: string | null;
  title: string;
  description: string;
  category: "attraction" | "food" | "nature" | "other" | "transport";
  reason: string;
  sources: AiPlannerSourceViewModel[];
};

export type AiPlannerDayViewModel = {
  id: string;
  label: string;
  title: string;
  summary: string;
  items: AiPlannerItemViewModel[];
};

export type AiPlannerPlanViewModel = {
  revision: number;
  title: string;
  destination: string;
  dateRange: string;
  summary: string;
  assumptions: string[];
  warnings: string[];
  checklist: string[];
  days: AiPlannerDayViewModel[];
};

export type AiPlannerIntakeAnswers = {
  destination: string;
  startDate: string;
  durationDays: number;
  tripBrief: string;
};

export type AiPlannerDraftSelection = {
  itineraryItemIds: string[];
  checklistItems: string[];
};
