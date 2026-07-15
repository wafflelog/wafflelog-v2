import { describe, expect, it } from "vitest";

import {
  canDeleteOwnEntity,
  canDeletePin,
  canEditOwnEntity,
  canEditPin,
  canEditPinLocation,
  canMutateChecklistItem,
  canViewTrip,
  isOwnEntity,
} from "./permissions";

describe("ownership permissions", () => {
  it("allows actions on an entity created by the current user", () => {
    const input = {
      currentUserId: "user-1",
      entityUserId: "user-1",
    };

    expect(isOwnEntity(input)).toBe(true);
    expect(canEditOwnEntity(input)).toBe(true);
    expect(canDeleteOwnEntity(input)).toBe(true);
  });

  it("denies actions on an entity created by another user", () => {
    const input = {
      currentUserId: "user-1",
      entityUserId: "user-2",
    };

    expect(isOwnEntity(input)).toBe(false);
    expect(canEditOwnEntity(input)).toBe(false);
    expect(canDeleteOwnEntity(input)).toBe(false);
  });

  it("denies actions when either user id is missing", () => {
    expect(
      isOwnEntity({
        currentUserId: null,
        entityUserId: "user-1",
      }),
    ).toBe(false);
    expect(
      isOwnEntity({
        currentUserId: "user-1",
        entityUserId: undefined,
      }),
    ).toBe(false);
  });
});

describe("pin permissions", () => {
  it("allows pin edit, delete, and location edit for the pin creator", () => {
    const input = {
      currentUserId: "user-1",
      entityUserId: "user-1",
    };

    expect(canEditPin(input)).toBe(true);
    expect(canDeletePin(input)).toBe(true);
    expect(canEditPinLocation(input)).toBe(true);
  });

  it("denies pin edit, delete, and location edit for non-creators", () => {
    const input = {
      currentUserId: "user-1",
      entityUserId: "user-2",
    };

    expect(canEditPin(input)).toBe(false);
    expect(canDeletePin(input)).toBe(false);
    expect(canEditPinLocation(input)).toBe(false);
  });
});

describe("trip access permissions", () => {
  it("allows trip view for owners", () => {
    expect(
      canViewTrip({
        isTripOwner: true,
        isActiveTripMember: false,
      }),
    ).toBe(true);
  });

  it("allows trip view for active members", () => {
    expect(
      canViewTrip({
        isTripOwner: false,
        isActiveTripMember: true,
      }),
    ).toBe(true);
  });

  it("denies trip view without ownership or active membership", () => {
    expect(
      canViewTrip({
        isTripOwner: false,
        isActiveTripMember: false,
      }),
    ).toBe(false);
  });
});

describe("checklist permissions", () => {
  it("allows checklist mutation for owners and active members", () => {
    expect(
      canMutateChecklistItem({
        isTripOwner: true,
        isActiveTripMember: false,
      }),
    ).toBe(true);
    expect(
      canMutateChecklistItem({
        isTripOwner: false,
        isActiveTripMember: true,
      }),
    ).toBe(true);
  });

  it("denies checklist mutation without trip access", () => {
    expect(
      canMutateChecklistItem({
        isTripOwner: false,
        isActiveTripMember: false,
      }),
    ).toBe(false);
  });
});

