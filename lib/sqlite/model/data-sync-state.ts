import { sqlite } from "@/lib/sqlite/client";

export async function actionGetInitialDownloadCompletedAt(userId: string) {
  const row = await sqlite.getFirstAsync<{
    initial_download_completed_at: string;
  }>(
    `
      select initial_download_completed_at
      from data_sync_state
      where user_id = ?
      limit 1
    `,
    [userId],
  );

  return row?.initial_download_completed_at ?? null;
}

export async function actionMarkInitialDownloadCompleted(userId: string) {
  const completedAt = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into data_sync_state (
        user_id,
        initial_download_completed_at
      ) values (?, ?)
      on conflict(user_id) do update set
        initial_download_completed_at = excluded.initial_download_completed_at
    `,
    [userId, completedAt],
  );

  return completedAt;
}
