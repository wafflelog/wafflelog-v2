import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  openURL: vi.fn(),
}));

vi.mock("expo-linking", () => ({
  openURL: mocks.openURL,
}));

const location = {
  latitude: 51.5074,
  longitude: -0.1278,
  name: "London",
  placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
};

describe("external map location", () => {
  beforeEach(() => {
    mocks.openURL.mockReset();
    mocks.openURL.mockResolvedValue(undefined);
  });

  it("builds an Apple Maps URL with the coordinates and place name", async () => {
    const { buildLocationMapUrl } = await import("./open-location");
    const url = new URL(buildLocationMapUrl(location, "apple_maps"));

    expect(url.origin).toBe("https://maps.apple.com");
    expect(url.searchParams.get("ll")).toBe("51.5074,-0.1278");
    expect(url.searchParams.get("q")).toBe("London");
  });

  it("builds a Google Maps URL with the Google Place ID", async () => {
    const { buildLocationMapUrl } = await import("./open-location");
    const url = new URL(buildLocationMapUrl(location, "google_maps"));

    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("51.5074,-0.1278");
    expect(url.searchParams.get("query_place_id")).toBe(location.placeId);
  });

  it("opens the generated map URL", async () => {
    const { buildLocationMapUrl, openLocationInMaps } = await import(
      "./open-location"
    );

    await openLocationInMaps(location, "google_maps");

    expect(mocks.openURL).toHaveBeenCalledWith(
      buildLocationMapUrl(location, "google_maps"),
    );
  });

  it("rejects invalid coordinates", async () => {
    const { buildLocationMapUrl } = await import("./open-location");

    expect(() =>
      buildLocationMapUrl(
        { ...location, latitude: Number.NaN },
        "apple_maps",
      ),
    ).toThrow("Location coordinates are invalid.");
  });
});
