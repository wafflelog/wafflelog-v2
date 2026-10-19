export function matchesAccountDeletionConfirmation(confirmation: string) {
  return confirmation.trim() === "delete";
}
