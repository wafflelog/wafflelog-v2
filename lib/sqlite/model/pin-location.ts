import { sqlite } from "../client";

export type LocalPinLocation = {
  pinId: string;
  userId: string;
  placeId: string;
  displayName: string;
  formattedAddress: string;
  imageUrl: string | null;
  localImageUri: string | null;
  rating: number | null;
  reviewCount: number | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

export type UpsertLocalPinLocationInput = {
  pinId: string;
  userId: string;
  placeId: string;
  displayName: string;
  formattedAddress: string;
  imageUrl?: string | null;
  localImageUri?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  latitude: number;
  longitude: number;
};

function mapLocalPinLocationRow(row: {
  pin_id: string;
  user_id: string;
  place_id: string;
  display_name: string;
  formatted_address: string;
  image_url: string | null;
  local_image_uri: string | null;
  rating: number | null;
  review_count: number | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}): LocalPinLocation {
  return {
    pinId: row.pin_id,
    userId: row.user_id,
    placeId: row.place_id,
    displayName: row.display_name,
    formattedAddress: row.formatted_address,
    imageUrl: row.image_url,
    localImageUri: row.local_image_uri,
    rating: row.rating,
    reviewCount: row.review_count,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function actionUpsertLocalPinLocation(
  input: UpsertLocalPinLocationInput,
) {
  const now = new Date().toISOString();
  const existing = await actionGetLocalPinLocation(input.pinId, input.userId);
  const createdAt = existing?.createdAt ?? now;

  const localPinLocation = {
    pin_id: input.pinId,
    user_id: input.userId,
    place_id: input.placeId,
    display_name: input.displayName.trim(),
    formatted_address: input.formattedAddress.trim(),
    image_url: input.imageUrl ?? null,
    local_image_uri: input.localImageUri ?? null,
    rating: input.rating ?? null,
    review_count: input.reviewCount ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    created_at: createdAt,
    updated_at: now,
  };

  await sqlite.runAsync(
    `
      insert into pin_location (
        pin_id,
        user_id,
        place_id,
        display_name,
        formatted_address,
        image_url,
        local_image_uri,
        rating,
        review_count,
        latitude,
        longitude,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(pin_id) do update set
        user_id = excluded.user_id,
        place_id = excluded.place_id,
        display_name = excluded.display_name,
        formatted_address = excluded.formatted_address,
        image_url = excluded.image_url,
        local_image_uri = excluded.local_image_uri,
        rating = excluded.rating,
        review_count = excluded.review_count,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = excluded.updated_at
    `,
    [
      localPinLocation.pin_id,
      localPinLocation.user_id,
      localPinLocation.place_id,
      localPinLocation.display_name,
      localPinLocation.formatted_address,
      localPinLocation.image_url,
      localPinLocation.local_image_uri,
      localPinLocation.rating,
      localPinLocation.review_count,
      localPinLocation.latitude,
      localPinLocation.longitude,
      localPinLocation.created_at,
      localPinLocation.updated_at,
    ],
  );

  return mapLocalPinLocationRow(localPinLocation);
}

export async function actionGetLocalPinLocation(pinId: string, userId: string) {
  const row = await sqlite.getFirstAsync<{
    pin_id: string;
    user_id: string;
    place_id: string;
    display_name: string;
    formatted_address: string;
    image_url: string | null;
    local_image_uri: string | null;
    rating: number | null;
    review_count: number | null;
    latitude: number;
    longitude: number;
    created_at: string;
    updated_at: string;
  }>(
    `
      select
        pin_id,
        user_id,
        place_id,
        display_name,
        formatted_address,
        image_url,
        local_image_uri,
        rating,
        review_count,
        latitude,
        longitude,
        created_at,
        updated_at
      from pin_location
      where pin_id = ? and user_id = ?
      limit 1
    `,
    [pinId, userId],
  );

  return row ? mapLocalPinLocationRow(row) : null;
}
