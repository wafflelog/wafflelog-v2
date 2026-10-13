import * as Linking from "expo-linking";

export type ExternalMapProvider = "apple_maps" | "google_maps";

export type ExternalMapLocation = {
  latitude: number;
  longitude: number;
  name: string;
  placeId?: string | null;
};

function getCoordinates(location: ExternalMapLocation) {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("Location coordinates are invalid.");
  }

  return `${location.latitude},${location.longitude}`;
}

export function buildLocationMapUrl(
  location: ExternalMapLocation,
  provider: ExternalMapProvider,
) {
  const coordinates = getCoordinates(location);

  if (provider === "apple_maps") {
    const parameters = new URLSearchParams({
      ll: coordinates,
      q: location.name.trim() || coordinates,
    });

    return `https://maps.apple.com/?${parameters.toString()}`;
  }

  const parameters = new URLSearchParams({
    api: "1",
    query: coordinates,
  });
  const placeId = location.placeId?.trim();

  if (placeId) {
    parameters.set("query_place_id", placeId);
  }

  return `https://www.google.com/maps/search/?${parameters.toString()}`;
}

export async function openLocationInMaps(
  location: ExternalMapLocation,
  provider: ExternalMapProvider,
) {
  await Linking.openURL(buildLocationMapUrl(location, provider));
}
