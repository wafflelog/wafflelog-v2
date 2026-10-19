import { sqlite } from "@/lib/sqlite/client";

export async function actionClearLocalData() {
  await sqlite.withTransactionAsync(async () => {
    await sqlite.execAsync(`
      delete from expense_participant;
      delete from expense;
      delete from note;
      delete from reference_link;
      delete from document;
      delete from image;
      delete from checklist_item;
      delete from pin_location;
      delete from pin;
      delete from trip_membership;
      delete from trip;
      delete from user_profile;
      delete from data_sync_state;
      delete from ai_planning_session;
    `);
  });
}
