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
  `);
}
