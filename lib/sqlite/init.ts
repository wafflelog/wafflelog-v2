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
      updated_at text not null
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
  `);

  const documentTableColumns = await sqlite.getAllAsync<{ name: string }>(
    `pragma table_info(document);`,
  );

  const hasLocalUriColumn = documentTableColumns.some(
    (column) => column.name === "local_uri",
  );

  if (!hasLocalUriColumn) {
    await sqlite.execAsync(`
      alter table document
      add column local_uri text;
    `);
  }
}
