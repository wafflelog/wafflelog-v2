import { getAnalytics, logScreenView } from "@react-native-firebase/analytics";

const analytics = getAnalytics();

type CountBucket = "0" | "1" | "2_5" | "6_10" | "11_plus";
type RefinementCountBucket = "0" | "1" | "2_3" | "4_plus";
export type TripDurationBucket =
  | "1_3_days"
  | "4_7_days"
  | "8_14_days"
  | "15_plus";

export type TripAssistantFailureReason =
  | "network"
  | "timeout"
  | "authentication"
  | "server"
  | "validation"
  | "unknown";

export type TrackingEventParameters = {
  sign_up: {
    method: "email";
  };
  email_verified: {
    method: "email";
  };
  trip_created: {
    creation_method: "manual" | "assistant";
    has_start_date: boolean;
  };
  trip_item_created: {
    item_type:
      | "pin"
      | "checklist"
      | "expense"
      | "image"
      | "document"
      | "link"
      | "note";
    source: "manual" | "assistant_import";
    user_role?: "owner" | "companion";
  };
  trip_assistant_started: {
    entry_point: "home" | "unfinished_plan";
    resumed: boolean;
  };
  trip_assistant_draft_generated: {
    draft_type: "initial" | "refinement";
    duration_bucket: TripDurationBucket;
  };
  trip_assistant_refinement_requested: Record<string, never>;
  trip_assistant_plan_accepted: {
    selected_item_count_bucket: CountBucket;
    refinement_count_bucket: RefinementCountBucket;
  };
  trip_assistant_failed: {
    stage: "create" | "generate" | "poll" | "refine" | "import";
    reason: TripAssistantFailureReason;
  };
  trip_invite_sent: {
    channel: "in_app";
  };
  trip_invite_responded: {
    outcome: "accepted" | "rejected";
  };
  pin_map_opened: {
    provider: "apple_maps" | "google_maps";
  };
};

export type TrackingEventName = keyof TrackingEventParameters;

const COUNT_BUCKETS = [
  { maximum: 0, value: "0" },
  { maximum: 1, value: "1" },
  { maximum: 5, value: "2_5" },
  { maximum: 10, value: "6_10" },
] as const;

const REFINEMENT_COUNT_BUCKETS = [
  { maximum: 0, value: "0" },
  { maximum: 1, value: "1" },
  { maximum: 3, value: "2_3" },
] as const;

export function getCountBucket(count: number): CountBucket {
  const normalizedCount = Math.max(0, Math.floor(count));

  return (
    COUNT_BUCKETS.find(({ maximum }) => normalizedCount <= maximum)?.value ??
    "11_plus"
  );
}

export function getRefinementCountBucket(
  count: number,
): RefinementCountBucket {
  const normalizedCount = Math.max(0, Math.floor(count));

  return (
    REFINEMENT_COUNT_BUCKETS.find(
      ({ maximum }) => normalizedCount <= maximum,
    )?.value ?? "4_plus"
  );
}

export const sendTrackingEvent = async <EventName extends TrackingEventName>(
  eventName: EventName,
  parameters: TrackingEventParameters[EventName],
) => {
  try {
    await analytics.logEvent(eventName, parameters);
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to send analytics event: ${eventName}`, error);
    }
  }
};

export const sendScreenViewEvent = async (from: string | null, to: string) => {
  if (__DEV__) {
    console.log("Sending screen view event:", { from, to });
  }

  try {
    await logScreenView(analytics, {
      screen_name: to,
      screen_class: to,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to send screen view event: ${to}`, error);
    }
  }
};
