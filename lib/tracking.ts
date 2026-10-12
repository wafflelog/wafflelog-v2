import { getAnalytics, logScreenView } from "@react-native-firebase/analytics";

const analytics = getAnalytics();

type CountBucket = "0" | "1" | "2_5" | "6_10" | "11_plus";
type RefinementCountBucket = "0" | "1" | "2_3" | "4_plus";
type TripDurationBucket =
  | "1_3_days"
  | "4_7_days"
  | "8_14_days"
  | "15_plus";

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
    user_role: "owner" | "companion";
  };
  trip_assistant_started: {
    entry_point: "home" | "unfinished_plan";
    resumed: boolean;
  };
  trip_assistant_draft_generated: {
    duration_bucket: TripDurationBucket;
  };
  trip_assistant_plan_accepted: {
    selected_item_count_bucket: CountBucket;
    refinement_count_bucket: RefinementCountBucket;
  };
  trip_assistant_failed: {
    stage: "create" | "poll" | "refine" | "import";
    reason:
      | "network"
      | "timeout"
      | "authentication"
      | "server"
      | "validation"
      | "unknown";
  };
  trip_invite_sent: {
    channel: "in_app";
  };
  trip_invite_responded: {
    outcome: "accepted" | "rejected";
  };
};

export type TrackingEventName = keyof TrackingEventParameters;

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
