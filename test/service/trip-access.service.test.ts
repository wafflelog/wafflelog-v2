import { describe, expect, it } from "vitest";

import { adminClient, createTestUser } from "./local-supabase";

describe("trip access RLS", () => {
  it("allows the owner and active companion to read a trip, but not an unrelated user", async () => {
    const owner = await createTestUser("owner");
    const companion = await createTestUser("companion");
    const unrelated = await createTestUser("unrelated");

    const tripId = crypto.randomUUID();
    const { error: tripError } = await adminClient.from("trip").insert({
      id: tripId,
      user_id: owner.id,
      title: "Service test trip",
      start_date: "2026-05-01",
      end_date: "2026-05-04",
    });
    expect(tripError).toBeNull();
    const { error: membershipError } = await adminClient.from("trip_member").insert({
      trip_id: tripId,
      user_id: companion.id,
      role: "companion",
      status: "active",
    });
    expect(membershipError).toBeNull();

    const [ownerResult, companionResult, unrelatedResult] = await Promise.all([
      owner.client.from("trip").select("id").eq("id", tripId),
      companion.client.from("trip").select("id").eq("id", tripId),
      unrelated.client.from("trip").select("id").eq("id", tripId),
    ]);

    expect(ownerResult.error).toBeNull();
    expect(ownerResult.data).toEqual([{ id: tripId }]);
    expect(companionResult.error).toBeNull();
    expect(companionResult.data).toEqual([{ id: tripId }]);
    expect(unrelatedResult.error).toBeNull();
    expect(unrelatedResult.data).toEqual([]);
  });
});
