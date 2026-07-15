import { getCreatorDisplayName } from "@/lib/helper/creator";
import { sqlite } from "@/lib/sqlite/client";

export type CreatorAttribution = {
  userId: string;
  username: string | null;
  isCurrentUser: boolean;
};

export type RemoteUserProfile = {
  id: string;
  username: string;
  updatedAt?: string | null;
};

export { getCreatorDisplayName };

export async function actionUpsertLocalUserProfilesFromRemote(
  profiles: RemoteUserProfile[],
) {
  for (const profile of profiles) {
    await sqlite.runAsync(
      `
        insert into user_profile (
          id,
          username,
          updated_at
        ) values (?, ?, ?)
        on conflict(id) do update set
          username = excluded.username,
          updated_at = excluded.updated_at
      `,
      [
        profile.id,
        profile.username,
        profile.updatedAt ?? new Date().toISOString(),
      ],
    );
  }
}
