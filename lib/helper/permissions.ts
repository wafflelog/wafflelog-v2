type UserOwnershipInput = {
  currentUserId: string | null | undefined;
  entityUserId: string | null | undefined;
  isTripOwner?: boolean;
};

type TripAccessInput = {
  isTripOwner: boolean;
  isActiveTripMember: boolean;
};

export function isOwnEntity({
  currentUserId,
  entityUserId,
}: UserOwnershipInput) {
  return Boolean(currentUserId && entityUserId && currentUserId === entityUserId);
}

export function canEditOwnEntity(input: UserOwnershipInput) {
  return isOwnEntity(input);
}

export function canDeleteOwnEntity(input: UserOwnershipInput) {
  return isOwnEntity(input);
}

export function canEditPin(input: UserOwnershipInput) {
  return Boolean(input.isTripOwner || canEditOwnEntity(input));
}

export function canDeletePin(input: UserOwnershipInput) {
  return Boolean(input.isTripOwner || canDeleteOwnEntity(input));
}

export function canEditPinLocation(input: UserOwnershipInput) {
  return canEditPin(input);
}

export function canViewTrip({ isTripOwner, isActiveTripMember }: TripAccessInput) {
  return isTripOwner || isActiveTripMember;
}

export function canMutateChecklistItem(input: TripAccessInput) {
  return canViewTrip(input);
}

