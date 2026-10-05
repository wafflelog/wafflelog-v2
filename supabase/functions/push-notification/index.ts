import { withSupabase } from "npm:@supabase/server@1.9.0";

type NotificationRecord = {
  id: string;
  user_id: string;
  actor_user_id: string | null;
  trip_id: string | null;
  trip_invitation_id: string | null;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type InsertWebhookPayload = {
  type: "INSERT";
  table: string;
  schema: string;
  record: NotificationRecord;
  old_record: null;
};

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, string>;
};

const pushEnabledNotificationTypes = new Set(["trip_invited"]);
const expoPushUrl = "https://exp.host/--/api/v2/push/send";

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status });

const isNotificationRecord = (
  record: unknown,
): record is NotificationRecord => {
  if (!record || typeof record !== "object") {
    return false;
  }

  const value = record as Record<string, unknown>;

  return (
    typeof value.id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.type === "string" &&
    typeof value.title === "string" &&
    typeof value.body === "string"
  );
};

const buildNavigationData = (record: NotificationRecord) => {
  const data: Record<string, string> = {
    notificationId: record.id,
    type: record.type,
  };

  if (record.trip_id) {
    data.tripId = record.trip_id;
  }

  if (record.trip_invitation_id) {
    data.invitationId = record.trip_invitation_id;
  }

  return data;
};

export default {
  fetch: withSupabase({ auth: "secret" }, async (request, context) => {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let payload: InsertWebhookPayload;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }

    if (
      payload.type !== "INSERT" ||
      payload.schema !== "public" ||
      payload.table !== "app_notification" ||
      !isNotificationRecord(payload.record)
    ) {
      return jsonResponse(
        { error: "Invalid app_notification webhook payload" },
        400,
      );
    }

    const notification = payload.record;

    if (!pushEnabledNotificationTypes.has(notification.type)) {
      return jsonResponse({
        ok: true,
        skipped: "notification_type_not_push_enabled",
        notificationType: notification.type,
        targetedDevices: 0,
      });
    }

    const { data: devices, error: devicesError } = await context.supabaseAdmin
      .from("user_push_device")
      .select("expo_push_token")
      .eq("user_id", notification.user_id);

    if (devicesError) {
      console.error("Failed to load push devices", devicesError);
      return jsonResponse({ error: "Failed to load push devices" }, 500);
    }

    if (!devices?.length) {
      return jsonResponse({
        ok: true,
        skipped: "no_registered_devices",
        targetedDevices: 0,
      });
    }

    const navigationData = buildNavigationData(notification);
    const messages: ExpoPushMessage[] = devices.map(({ expo_push_token }) => ({
      to: expo_push_token,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: navigationData,
    }));

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    if (expoAccessToken) {
      headers.Authorization = `Bearer ${expoAccessToken}`;
    }

    const expoResponse = await fetch(expoPushUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
    const expoResult = await expoResponse.json();

    if (!expoResponse.ok) {
      console.error("Expo rejected push request", expoResult);
      return jsonResponse(
        {
          error: "Expo rejected push request",
          targetedDevices: messages.length,
        },
        502,
      );
    }

    return jsonResponse({
      ok: true,
      targetedDevices: messages.length,
      expo: expoResult,
    });
  }),
};
