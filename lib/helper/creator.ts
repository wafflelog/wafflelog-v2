export type CreatorDisplayInput = {
  username: string | null;
  isCurrentUser: boolean;
};

export function getCreatorDisplayName(creator?: CreatorDisplayInput | null) {
  if (!creator) {
    return "Unknown creator";
  }

  if (creator.isCurrentUser) {
    return "You";
  }

  return creator.username ? `@${creator.username}` : "Unknown creator";
}
