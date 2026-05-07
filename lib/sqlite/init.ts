import { sqlite } from "./client";

export async function initializeDatabase() {
  await sqlite.execAsync(`
    create table if not exists trip (
      id text primary key not null,
      user_id text not null,
      title text not null,
      start_date text not null,
      end_date text not null,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists checklist_item (
      id text primary key not null,
      trip_id text not null,
      user_id text not null,
      title text not null,
      completed integer not null default 0,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists pin (
      id text primary key not null,
      trip_id text not null,
      user_id text not null,
      name text not null,
      date text not null,
      time text not null,
      category_id text not null,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists note (
      id text primary key not null,
      pin_id text not null,
      user_id text not null,
      text text not null,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists reference_link (
      id text primary key not null,
      pin_id text not null,
      user_id text not null,
      title text,
      url text not null,
      caption text,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists document (
      id text primary key not null,
      trip_id text not null,
      pin_id text,
      user_id text not null,
      file_name text not null,
      mime_type text not null,
      storage_bucket text not null,
      storage_path text not null,
      caption text,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists image (
      id text primary key not null,
      pin_id text not null,
      trip_id text not null,
      user_id text not null,
      local_uri text not null,
      storage_bucket text not null,
      storage_path text not null,
      mime_type text not null,
      width integer not null,
      height integer not null,
      caption text,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists expense (
      id text primary key not null,
      pin_id text not null,
      trip_id text not null,
      user_id text not null,
      description text not null,
      amount real not null,
      currency text not null,
      paid_by_user_id text not null,
      paid_by_name text not null,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text
    );

    create table if not exists pin_location (
      pin_id text primary key not null,
      user_id text not null,
      place_id text not null,
      display_name text not null,
      formatted_address text not null,
      image_url text,
      local_image_uri text,
      rating real,
      review_count integer,
      latitude real not null,
      longitude real not null,
      created_at text not null,
      updated_at text not null
    );
  `);

  const hasLegacyTripIds = await sqlite.getFirstAsync<{ id: string }>(
    `
      select id
      from trip
      where id like 'trip_%'
      limit 1
    `,
  );

  if (hasLegacyTripIds) {
    await sqlite.execAsync(`
      delete from reference_link;
      delete from checklist_item;
      delete from document;
      delete from image;
      delete from expense;
      delete from pin_location;
      delete from pin;
      delete from trip;
    `);
  }

  const documentTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(document);`,
  );

  const imageTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(image);`,
  );

  const pinTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(pin);`,
  );

  const hasPinSyncStatusColumn = pinTableColumns.some(
    (column) => column.name === "sync_status",
  );

  if (!hasPinSyncStatusColumn) {
    await sqlite.execAsync(`
      alter table pin
      add column sync_status text not null default 'pending';
    `);
  }

  const hasPinLastSyncedAtColumn = pinTableColumns.some(
    (column) => column.name === "last_synced_at",
  );

  if (!hasPinLastSyncedAtColumn) {
    await sqlite.execAsync(`
      alter table pin
      add column last_synced_at text;
    `);
  }

  const hasPinSyncErrorColumn = pinTableColumns.some(
    (column) => column.name === "sync_error",
  );

  if (!hasPinSyncErrorColumn) {
    await sqlite.execAsync(`
      alter table pin
      add column sync_error text;
    `);
  }

  const hasLocalUriColumn = documentTableColumns.some(
    (column) => column.name === "local_uri",
  );

  if (!hasLocalUriColumn) {
    await sqlite.execAsync(`
      alter table document
      add column local_uri text;
    `);
  }

  const hasImageStorageBucketColumn = imageTableColumns.some(
    (column) => column.name === "storage_bucket",
  );

  if (!hasImageStorageBucketColumn) {
    await sqlite.execAsync(`
      alter table image
      add column storage_bucket text not null default '';
    `);
  }

  const hasImageStoragePathColumn = imageTableColumns.some(
    (column) => column.name === "storage_path",
  );

  if (!hasImageStoragePathColumn) {
    await sqlite.execAsync(`
      alter table image
      add column storage_path text not null default '';
    `);
  }
}
