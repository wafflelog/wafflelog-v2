import { sqlite } from "./client";

export async function initializeDatabase() {
  const existingPinColumns = await sqlite.getAllAsync<{ name: string }>(
    "pragma table_info(pin)",
  );
  const hasOldPinSchema =
    existingPinColumns.length > 0 &&
    (!existingPinColumns.some((column) => column.name === "start_date") ||
      existingPinColumns.some((column) => column.name === "all_day"));

  if (hasOldPinSchema) {
    await sqlite.execAsync(`
      drop table if exists note;
      drop table if exists reference_link;
      drop table if exists expense;
      drop table if exists image;
      drop table if exists document;
      drop table if exists pin_location;
      drop table if exists pin;
    `);
  }

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
      sync_error text,
      deleted_at text
    );

    create table if not exists trip_membership (
      trip_id text not null,
      user_id text not null,
      role text not null,
      status text not null,
      source text not null,
      created_at text not null,
      updated_at text not null,
      last_synced_at text,
      primary key (trip_id, user_id)
    );

    create table if not exists user_profile (
      id text primary key not null,
      username text not null,
      updated_at text not null
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
      sync_error text,
      deleted_at text
    );

    create table if not exists pin (
      id text primary key not null,
      trip_id text not null,
      user_id text not null,
      name text,
      start_date text not null,
      end_date text,
      time text,
      end_time text,
      category_id text not null,
      metadata_json text not null default '{"version":1}',
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text,
      deleted_at text
    );

    create table if not exists note (
      id text primary key not null,
      trip_id text not null,
      pin_id text,
      user_id text not null,
      text text not null,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text,
      deleted_at text
    );

    create table if not exists reference_link (
      id text primary key not null,
      trip_id text not null,
      pin_id text,
      user_id text not null,
      title text,
      url text not null,
      caption text,
      created_at text not null,
      updated_at text not null,
      sync_status text not null,
      last_synced_at text,
      sync_error text,
      deleted_at text
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
      sync_error text,
      deleted_at text
    );

    create table if not exists image (
      id text primary key not null,
      pin_id text,
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
      sync_error text,
      deleted_at text
    );

    create table if not exists expense (
      id text primary key not null,
      pin_id text,
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
      sync_error text,
      deleted_at text
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

  const endTimePinTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(pin);`,
  );

  if (!endTimePinTableColumns.some((column) => column.name === "end_time")) {
    await sqlite.execAsync(`alter table pin add column end_time text;`);
  }

  const documentTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(document);`,
  );

  const tripTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(trip);`,
  );

  const checklistItemTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(checklist_item);`,
  );

  let referenceLinkTableColumns = await sqlite.getAllAsync<{
    name: string;
    notnull: number;
  }>(`pragma table_info(reference_link);`);

  const hasCurrentReferenceLinkSchema =
    referenceLinkTableColumns.some((column) => column.name === "trip_id") &&
    referenceLinkTableColumns.some(
      (column) => column.name === "pin_id" && column.notnull === 0,
    );

  if (!hasCurrentReferenceLinkSchema) {
    await sqlite.execAsync(`
      drop table if exists reference_link;

      create table reference_link (
        id text primary key not null,
        trip_id text not null,
        pin_id text,
        user_id text not null,
        title text,
        url text not null,
        caption text,
        created_at text not null,
        updated_at text not null,
        sync_status text not null,
        last_synced_at text,
        sync_error text,
        deleted_at text
      );
    `);

    referenceLinkTableColumns = await sqlite.getAllAsync<{
      name: string;
      notnull: number;
    }>(`pragma table_info(reference_link);`);
  }

  let expenseTableColumns = await sqlite.getAllAsync<{
    name: string;
    notnull: number;
  }>(`pragma table_info(expense);`);

  const hasCurrentExpenseSchema = expenseTableColumns.some(
    (column) => column.name === "pin_id" && column.notnull === 0,
  );

  if (!hasCurrentExpenseSchema) {
    await sqlite.execAsync(`
      drop table if exists expense;

      create table expense (
        id text primary key not null,
        pin_id text,
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
        sync_error text,
        deleted_at text
      );
    `);

    expenseTableColumns = await sqlite.getAllAsync<{
      name: string;
      notnull: number;
    }>(`pragma table_info(expense);`);
  }

  let imageTableColumns = await sqlite.getAllAsync<{
    name: string;
    notnull: number;
  }>(`pragma table_info(image);`);

  const hasCurrentImageSchema = imageTableColumns.some(
    (column) => column.name === "pin_id" && column.notnull === 0,
  );

  if (!hasCurrentImageSchema) {
    await sqlite.execAsync(`
      drop table if exists image;

      create table image (
        id text primary key not null,
        pin_id text,
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
        sync_error text,
        deleted_at text
      );
    `);

    imageTableColumns = await sqlite.getAllAsync<{
      name: string;
      notnull: number;
    }>(`pragma table_info(image);`);
  }

  const pinTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(pin);`,
  );

  const hasTripDeletedAtColumn = tripTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasTripDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table trip
      add column deleted_at text;
    `);
  }

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

  const hasPinDeletedAtColumn = pinTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasPinDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table pin
      add column deleted_at text;
    `);
  }

  let noteTableColumns = await sqlite.getAllAsync<{
    name: string;
    notnull: number;
  }>(
    `pragma table_info(note);`,
  );

  const hasCurrentNoteSchema =
    noteTableColumns.some((column) => column.name === "trip_id") &&
    noteTableColumns.some(
      (column) => column.name === "pin_id" && column.notnull === 0,
    );

  if (!hasCurrentNoteSchema) {
    await sqlite.execAsync(`
      drop table if exists note;

      create table note (
        id text primary key not null,
        trip_id text not null,
        pin_id text,
        user_id text not null,
        text text not null,
        created_at text not null,
        updated_at text not null,
        sync_status text not null,
        last_synced_at text,
        sync_error text,
        deleted_at text
      );
    `);

    noteTableColumns = await sqlite.getAllAsync<{
      name: string;
      notnull: number;
    }>(`pragma table_info(note);`);
  }

  const hasNoteDeletedAtColumn = noteTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasNoteDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table note
      add column deleted_at text;
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

  const hasDocumentDeletedAtColumn = documentTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasDocumentDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table document
      add column deleted_at text;
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

  const hasImageDeletedAtColumn = imageTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasImageDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table image
      add column deleted_at text;
    `);
  }

  const hasReferenceLinkDeletedAtColumn = referenceLinkTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  const hasChecklistItemDeletedAtColumn = checklistItemTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasChecklistItemDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table checklist_item
      add column deleted_at text;
    `);
  }

  if (!hasReferenceLinkDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table reference_link
      add column deleted_at text;
    `);
  }

  const hasExpenseDeletedAtColumn = expenseTableColumns.some(
    (column) => column.name === "deleted_at",
  );

  if (!hasExpenseDeletedAtColumn) {
    await sqlite.execAsync(`
      alter table expense
      add column deleted_at text;
    `);
  }
}
