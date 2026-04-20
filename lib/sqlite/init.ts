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
  `);
}
