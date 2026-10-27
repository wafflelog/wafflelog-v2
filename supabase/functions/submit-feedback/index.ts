import { withSupabase } from "npm:@supabase/server@1.9.0";

const feedbackCategories = ["feedback", "bug", "help"] as const;
const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  feedback: "Feedback",
  bug: "Bug report",
  help: "Help request",
};
const messageLimit = 2000;
const metadataLimit = 100;
const resendUrl = "https://api.resend.com/emails";
const feedbackSender = "Wafflelog Feedback <no-reply@wafflelog.co.uk>";
const feedbackRecipient = "support@wafflelog.co.uk";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FeedbackCategory = (typeof feedbackCategories)[number];

type FeedbackPayload = {
  requestId: string;
  category: FeedbackCategory;
  message: string;
  appVersion?: string;
  buildNumber?: string;
  platform?: string;
  osVersion?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status });

const isOptionalMetadata = (value: unknown) =>
  value === undefined ||
  (typeof value === "string" && value.length <= metadataLimit);

const isFeedbackPayload = (payload: unknown): payload is FeedbackPayload => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  const value = payload as Record<string, unknown>;
  const message = typeof value.message === "string" ? value.message.trim() : "";

  return (
    typeof value.requestId === "string" &&
    uuidPattern.test(value.requestId) &&
    typeof value.category === "string" &&
    feedbackCategories.includes(value.category as FeedbackCategory) &&
    message.length > 0 &&
    message.length <= messageLimit &&
    isOptionalMetadata(value.appVersion) &&
    isOptionalMetadata(value.buildNumber) &&
    isOptionalMetadata(value.platform) &&
    isOptionalMetadata(value.osVersion)
  );
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const metadataValue = (value: string | undefined) => value || "Not available";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const userId = context.userClaims?.id;
    const userEmail = context.userClaims?.email;

    if (!userId || typeof userEmail !== "string") {
      return jsonResponse({ error: "Authenticated email is required" }, 401);
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }

    if (!isFeedbackPayload(payload)) {
      return jsonResponse({ error: "Invalid feedback payload" }, 400);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error(
        "Feedback email is not configured: RESEND_API_KEY is missing",
      );
      return jsonResponse({ error: "Feedback delivery is unavailable" }, 503);
    }

    const categoryLabel = feedbackCategoryLabels[payload.category];
    const message = payload.message.trim();
    const text = [
      categoryLabel,
      "",
      message,
      "",
      "Sender",
      `Email: ${userEmail}`,
      `User ID: ${userId}`,
      "",
      "App context",
      `Version: ${metadataValue(payload.appVersion)}`,
      `Build: ${metadataValue(payload.buildNumber)}`,
      `Platform: ${metadataValue(payload.platform)}`,
      `OS version: ${metadataValue(payload.osVersion)}`,
    ].join("\n");
    const html = `
      <h2>${escapeHtml(categoryLabel)}</h2>
      <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
      <hr />
      <h3>Sender</h3>
      <p>
        Email: ${escapeHtml(userEmail)}<br />
        User ID: ${escapeHtml(userId)}
      </p>
      <h3>App context</h3>
      <p>
        Version: ${escapeHtml(metadataValue(payload.appVersion))}<br />
        Build: ${escapeHtml(metadataValue(payload.buildNumber))}<br />
        Platform: ${escapeHtml(metadataValue(payload.platform))}<br />
        OS version: ${escapeHtml(metadataValue(payload.osVersion))}
      </p>
    `;

    try {
      const resendResponse = await fetch(resendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `feedback-${userId}-${payload.requestId}`,
        },
        body: JSON.stringify({
          from: feedbackSender,
          to: [feedbackRecipient],
          reply_to: userEmail,
          subject: `Wafflelog ${categoryLabel.toLowerCase()}`,
          text,
          html,
          tags: [{ name: "category", value: payload.category }],
        }),
      });

      if (!resendResponse.ok) {
        const responseBody = await resendResponse.text();
        console.error("Resend rejected feedback email", {
          status: resendResponse.status,
          response: responseBody.slice(0, 500),
        });
        return jsonResponse({ error: "Feedback delivery failed" }, 502);
      }

      return jsonResponse({ ok: true });
    } catch (error) {
      console.error("Feedback delivery failed", error);
      return jsonResponse({ error: "Feedback delivery failed" }, 502);
    }
  }),
};
