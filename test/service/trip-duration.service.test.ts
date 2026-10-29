import { describe, expect, it } from "vitest";

import { createTestUser } from "./local-supabase";

describe("trip duration", () => {
  it("accepts 120 days and rejects a longer trip", async () => {
    const owner = await createTestUser("dates");

    const validTrip = await owner.client.from("trip").insert({
      id: crypto.randomUUID(),
      user_id: owner.id,
      title: "120-day trip",
      start_date: "2026-01-01",
      end_date: "2026-04-30",
    });
    expect(validTrip.error).toBeNull();

    const invalidTrip = await owner.client.from("trip").insert({
      id: crypto.randomUUID(),
      user_id: owner.id,
      title: "121-day trip",
      start_date: "2026-01-01",
      end_date: "2026-05-01",
    });
    expect(invalidTrip.error).toMatchObject({
      code: "23514",
      message: expect.stringContaining("trip_duration_max_120_days"),
    });
  });
});
