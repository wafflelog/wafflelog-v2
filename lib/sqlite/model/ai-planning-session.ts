import { sqlite } from "@/lib/sqlite/client";

export const LOCAL_AI_PLANNING_SESSION_STATUSES = [
  "queued",
  "researching",
  "drafting",
  "validating",
  "completed",
  "failed",
  "cancelled",
  "imported",
] as const;

export type LocalAiPlanningSessionStatus =
  (typeof LOCAL_AI_PLANNING_SESSION_STATUSES)[number];

export type LocalAiPlanningSession = {
  id: string;
  userId: string;
  destination: string;
  durationDays: number;
  startDate: string;
  activeJobId: string | null;
  status: LocalAiPlanningSessionStatus;
  progressStage: string | null;
  progressMessage: string | null;
  importedTripId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertLocalAiPlanningSessionInput = {
  id: string;
  userId: string;
  destination: string;
  durationDays: number;
  startDate: string;
  activeJobId: string;
  status: Exclude<LocalAiPlanningSessionStatus, "imported">;
};

export type UpdateLocalAiPlanningSessionJobInput = {
  id: string;
  userId: string;
  activeJobId: string | null;
  status: Exclude<LocalAiPlanningSessionStatus, "imported">;
  progressStage?: string | null;
  progressMessage?: string | null;
};

type LocalAiPlanningSessionRow = {
  id: string;
  user_id: string;
  destination: string;
  duration_days: number;
  start_date: string;
  active_job_id: string | null;
  status: LocalAiPlanningSessionStatus;
  progress_stage: string | null;
  progress_message: string | null;
  imported_trip_id: string | null;
  created_at: string;
  updated_at: string;
};

const selectLocalAiPlanningSessionColumns = `
  id,
  user_id,
  destination,
  duration_days,
  start_date,
  active_job_id,
  status,
  progress_stage,
  progress_message,
  imported_trip_id,
  created_at,
  updated_at
`;

function mapLocalAiPlanningSessionRow(
  row: LocalAiPlanningSessionRow,
): LocalAiPlanningSession {
  return {
    id: row.id,
    userId: row.user_id,
    destination: row.destination,
    durationDays: row.duration_days,
    startDate: row.start_date,
    activeJobId: row.active_job_id,
    status: row.status,
    progressStage: row.progress_stage,
    progressMessage: row.progress_message,
    importedTripId: row.imported_trip_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeRequiredValue(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} is required`);
  }

  return normalized;
}

export async function actionUpsertLocalAiPlanningSession(
  input: UpsertLocalAiPlanningSessionInput,
) {
  if (!Number.isInteger(input.durationDays) || input.durationDays < 1) {
    throw new Error("Duration must be at least one day");
  }

  const id = normalizeRequiredValue(input.id, "Planning session ID");
  const userId = normalizeRequiredValue(input.userId, "User ID");
  const destination = normalizeRequiredValue(input.destination, "Destination");
  const startDate = normalizeRequiredValue(input.startDate, "Start date");
  const activeJobId = normalizeRequiredValue(input.activeJobId, "Job ID");
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      insert into ai_planning_session (
        id,
        user_id,
        destination,
        duration_days,
        start_date,
        active_job_id,
        status,
        progress_stage,
        progress_message,
        imported_trip_id,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        destination = excluded.destination,
        duration_days = excluded.duration_days,
        start_date = excluded.start_date,
        active_job_id = excluded.active_job_id,
        status = excluded.status,
        progress_stage = null,
        progress_message = null,
        updated_at = excluded.updated_at
      where ai_planning_session.user_id = excluded.user_id
        and ai_planning_session.imported_trip_id is null
    `,
    [
      id,
      userId,
      destination,
      input.durationDays,
      startDate,
      activeJobId,
      input.status,
      null,
      null,
      null,
      now,
      now,
    ],
  );

  const session = await actionGetLocalAiPlanningSession(id, userId);

  if (!session) {
    throw new Error("Planning session could not be saved");
  }

  return session;
}

export async function actionGetLocalAiPlanningSession(
  id: string,
  userId: string,
) {
  const row = await sqlite.getFirstAsync<LocalAiPlanningSessionRow>(
    `
      select ${selectLocalAiPlanningSessionColumns}
      from ai_planning_session
      where id = ? and user_id = ?
      limit 1
    `,
    [id, userId],
  );

  return row ? mapLocalAiPlanningSessionRow(row) : null;
}

export async function actionListLocalAiPlanningSessions(userId: string) {
  const rows = await sqlite.getAllAsync<LocalAiPlanningSessionRow>(
    `
      select ${selectLocalAiPlanningSessionColumns}
      from ai_planning_session
      where user_id = ?
      order by updated_at desc, created_at desc
    `,
    [userId],
  );

  return rows.map(mapLocalAiPlanningSessionRow);
}

export async function actionUpdateLocalAiPlanningSessionJob(
  input: UpdateLocalAiPlanningSessionJobInput,
) {
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update ai_planning_session
      set
        active_job_id = ?,
        status = ?,
        progress_stage = ?,
        progress_message = ?,
        updated_at = ?
      where id = ?
        and user_id = ?
        and imported_trip_id is null
    `,
    [
      input.activeJobId,
      input.status,
      input.progressStage?.trim() || null,
      input.progressMessage?.trim() || null,
      now,
      input.id,
      input.userId,
    ],
  );

  const session = await actionGetLocalAiPlanningSession(input.id, input.userId);

  if (!session) {
    throw new Error("Planning session not found");
  }

  return session;
}

export async function actionMarkLocalAiPlanningSessionImported(
  id: string,
  userId: string,
  tripId: string,
) {
  const session = await actionGetLocalAiPlanningSession(id, userId);

  if (!session) {
    throw new Error("Planning session not found");
  }

  if (session.importedTripId) {
    return session;
  }

  const normalizedTripId = normalizeRequiredValue(tripId, "Trip ID");
  const now = new Date().toISOString();

  await sqlite.runAsync(
    `
      update ai_planning_session
      set
        active_job_id = null,
        status = 'imported',
        progress_stage = null,
        progress_message = null,
        imported_trip_id = ?,
        updated_at = ?
      where id = ?
        and user_id = ?
        and imported_trip_id is null
    `,
    [normalizedTripId, now, id, userId],
  );

  return (await actionGetLocalAiPlanningSession(id, userId))!;
}

export async function actionDeleteLocalAiPlanningSession(
  id: string,
  userId: string,
) {
  await sqlite.runAsync(
    `
      delete from ai_planning_session
      where id = ? and user_id = ?
    `,
    [id, userId],
  );
}

