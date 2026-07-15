export type ExpensePayerDisplayInput = {
  paidByUserId: string;
  paidByName: string;
  paidByUsername: string | null;
  currentUserId: string;
};

export function getExpensePayerDisplayName({
  paidByUserId,
  paidByName,
  paidByUsername,
  currentUserId,
}: ExpensePayerDisplayInput) {
  if (paidByUserId === currentUserId) {
    return "You";
  }

  if (paidByUsername) {
    return `@${paidByUsername}`;
  }

  return paidByName === "You" ? "Unknown payer" : paidByName;
}

