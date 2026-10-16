import { getUserDisplayName } from "./user-display";

export type CreatorDisplayInput = {
  userId: string;
  username: string | null;
  isCurrentUser: boolean;
};

export function getCreatorDisplayName(creator?: CreatorDisplayInput | null) {
  if (!creator) {
    return "Unknown creator";
  }

  return getUserDisplayName(
    creator,
    creator.isCurrentUser ? creator.userId : null,
    "Unknown creator",
  );
}
