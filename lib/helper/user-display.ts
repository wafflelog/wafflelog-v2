export type UserDisplayInput = {
  userId: string;
  username?: string | null;
};

export function getUserDisplayName(
  user: UserDisplayInput,
  currentUserId?: string | null,
  fallback = "Unknown user",
) {
  if (currentUserId && user.userId === currentUserId) {
    return "You";
  }

  const username = user.username?.trim().replace(/^@+/, "");

  return username ? `@${username}` : fallback;
}
