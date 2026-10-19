import { withSupabase } from "npm:@supabase/server@1.9.0";

type StorageFileRecord = {
  storage_bucket: string;
  storage_path: string;
};

const databasePageSize = 1_000;
const tripIdBatchSize = 100;
const storageRemovalBatchSize = 1_000;

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status });

const splitIntoBatches = <Item>(items: Item[], batchSize: number) => {
  const batches: Item[][] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
};

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const userId = context.userClaims?.id;

    if (!userId) {
      return jsonResponse({ error: "Unauthenticated" }, 401);
    }

    try {
      const ownedTripIds: string[] = [];
      let tripOffset = 0;

      while (true) {
        const { data: trips, error: tripsError } = await context.supabaseAdmin
          .from("trip")
          .select("id")
          .eq("user_id", userId)
          .range(tripOffset, tripOffset + databasePageSize - 1);

        if (tripsError) {
          throw tripsError;
        }

        ownedTripIds.push(...(trips ?? []).map(({ id }) => id));

        if (!trips || trips.length < databasePageSize) {
          break;
        }

        tripOffset += databasePageSize;
      }

      const storageFiles = new Map<string, Set<string>>();
      const addStorageFiles = (records: StorageFileRecord[]) => {
        for (const record of records) {
          const bucketFiles = storageFiles.get(record.storage_bucket) ??
            new Set<string>();
          bucketFiles.add(record.storage_path);
          storageFiles.set(record.storage_bucket, bucketFiles);
        }
      };
      const fileTables = ["image", "document"] as const;

      for (const table of fileTables) {
        let userFileOffset = 0;

        while (true) {
          const { data: files, error: filesError } = await context.supabaseAdmin
            .from(table)
            .select("storage_bucket, storage_path")
            .eq("user_id", userId)
            .range(
              userFileOffset,
              userFileOffset + databasePageSize - 1,
            );

          if (filesError) {
            throw filesError;
          }

          addStorageFiles(files ?? []);

          if (!files || files.length < databasePageSize) {
            break;
          }

          userFileOffset += databasePageSize;
        }

        for (
          const tripIds of splitIntoBatches(
            ownedTripIds,
            tripIdBatchSize,
          )
        ) {
          let tripFileOffset = 0;

          while (true) {
            const { data: files, error: filesError } = await context
              .supabaseAdmin
              .from(table)
              .select("storage_bucket, storage_path")
              .in("trip_id", tripIds)
              .range(
                tripFileOffset,
                tripFileOffset + databasePageSize - 1,
              );

            if (filesError) {
              throw filesError;
            }

            addStorageFiles(files ?? []);

            if (!files || files.length < databasePageSize) {
              break;
            }

            tripFileOffset += databasePageSize;
          }
        }
      }

      for (const [bucket, paths] of storageFiles) {
        for (
          const pathBatch of splitIntoBatches(
            [...paths],
            storageRemovalBatchSize,
          )
        ) {
          const { error: storageError } = await context.supabaseAdmin.storage
            .from(bucket)
            .remove(pathBatch);

          if (storageError) {
            throw storageError;
          }
        }
      }

      const { error: deletionError } = await context.supabaseAdmin.auth.admin
        .deleteUser(userId);

      if (deletionError) {
        throw deletionError;
      }

      return jsonResponse({ ok: true });
    } catch (error) {
      console.error("Account deletion failed", error);
      return jsonResponse({ error: "Account deletion failed" }, 500);
    }
  }),
};
