import { type PinMetadata } from "@/types/pin";
import { supabase } from "./client";
import { type Json, type Tables, type TablesInsert } from "./types";

export type CreateTripInput = {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type CreatePinInput = {
  id?: string;
  tripId: string;
  name: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  categoryId: string;
  metadataJson: PinMetadata;
};

export type CreateChecklistItemInput = {
  id: string;
  tripId: string;
  title: string;
  completed: boolean;
};

export type CreateNoteInput = {
  id: string;
  pinId: string;
  text: string;
};

export type CreateReferenceLinkInput = {
  id: string;
  pinId: string;
  title: string | null;
  url: string;
  caption: string | null;
};

export type CreateExpenseInput = {
  id: string;
  pinId: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  paidByUserId: string;
  paidByName: string;
};

export type CreateDocumentInput = {
  id: string;
  tripId: string;
  pinId: string | null;
  fileName: string;
  mimeType: string;
  storageBucket: string;
  storagePath: string;
  caption: string | null;
};

export type CreateImageInput = {
  id: string;
  pinId: string;
  tripId: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  caption: string | null;
};

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type CreateTripInvitationInput = {
  tripId: string;
  inviteeUserId: string;
};

export type TripRow = Tables<"trip">;
export type PublicUserRow = Tables<"user">;
export type TripInvitationRow = Tables<"trip_invitation">;

const mapTripRow = (trip: TripRow) => ({
  id: trip.id,
  title: trip.title,
  startDate: trip.start_date,
  endDate: trip.end_date,
  createdAt: trip.created_at,
  updatedAt: trip.updated_at,
  deletedAt: trip.deleted_at,
});

const mapPinMetadata = (metadata: Json): PinMetadata => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { version: 1 };
  }

  return {
    version: 1,
    departure:
      typeof metadata.departure === "string" ? metadata.departure : undefined,
    destination:
      typeof metadata.destination === "string"
        ? metadata.destination
        : undefined,
    carrier: typeof metadata.carrier === "string" ? metadata.carrier : undefined,
    reference:
      typeof metadata.reference === "string" ? metadata.reference : undefined,
  };
};

const mapPinRow = (pin: {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  end_date: string;
  end_time: string | null;
  all_day: boolean;
  category_id: string;
  metadata_json: Json;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: pin.id,
  tripId: pin.trip_id,
  userId: pin.user_id,
  name: pin.name,
  startDate: pin.start_date,
  startTime: pin.start_time,
  endDate: pin.end_date,
  endTime: pin.end_time,
  allDay: pin.all_day,
  categoryId: pin.category_id,
  metadataJson: mapPinMetadata(pin.metadata_json),
  createdAt: pin.created_at,
  updatedAt: pin.updated_at,
  deletedAt: pin.deleted_at,
});

const mapChecklistItemRow = (checklistItem: {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: checklistItem.id,
  tripId: checklistItem.trip_id,
  userId: checklistItem.user_id,
  title: checklistItem.title,
  completed: checklistItem.completed,
  createdAt: checklistItem.created_at,
  updatedAt: checklistItem.updated_at,
  deletedAt: checklistItem.deleted_at,
});

const mapNoteRow = (note: {
  id: string;
  pin_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: note.id,
  pinId: note.pin_id,
  userId: note.user_id,
  text: note.text,
  createdAt: note.created_at,
  updatedAt: note.updated_at,
  deletedAt: note.deleted_at,
});

const mapReferenceLinkRow = (referenceLink: {
  id: string;
  pin_id: string;
  user_id: string;
  title: string | null;
  url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: referenceLink.id,
  pinId: referenceLink.pin_id,
  userId: referenceLink.user_id,
  title: referenceLink.title,
  url: referenceLink.url,
  caption: referenceLink.caption,
  createdAt: referenceLink.created_at,
  updatedAt: referenceLink.updated_at,
  deletedAt: referenceLink.deleted_at,
});

const mapExpenseRow = (expense: {
  id: string;
  pin_id: string;
  trip_id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by_user_id: string;
  paid_by_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: expense.id,
  pinId: expense.pin_id,
  tripId: expense.trip_id,
  userId: expense.user_id,
  description: expense.description,
  amount: expense.amount,
  currency: expense.currency,
  paidByUserId: expense.paid_by_user_id,
  paidByName: expense.paid_by_name,
  createdAt: expense.created_at,
  updatedAt: expense.updated_at,
  deletedAt: expense.deleted_at,
});

const mapDocumentRow = (document: {
  id: string;
  trip_id: string;
  pin_id: string | null;
  user_id: string;
  file_name: string;
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: document.id,
  tripId: document.trip_id,
  pinId: document.pin_id,
  userId: document.user_id,
  fileName: document.file_name,
  mimeType: document.mime_type,
  storageBucket: document.storage_bucket,
  storagePath: document.storage_path,
  caption: document.caption,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
  deletedAt: document.deleted_at,
});

const mapImageRow = (image: {
  id: string;
  pin_id: string;
  trip_id: string;
  user_id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  caption: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}) => ({
  id: image.id,
  pinId: image.pin_id,
  tripId: image.trip_id,
  userId: image.user_id,
  storageBucket: image.storage_bucket,
  storagePath: image.storage_path,
  mimeType: image.mime_type,
  width: image.width,
  height: image.height,
  caption: image.caption,
  createdAt: image.created_at,
  updatedAt: image.updated_at,
  deletedAt: image.deleted_at,
});

const mapPublicUserRow = (user: PublicUserRow) => ({
  id: user.id,
  username: user.username,
});

const mapTripInvitationStatus = (status: string) => {
  switch (status) {
    case "accepted":
      return "ACCEPTED" as const;
    case "rejected":
      return "REJECTED" as const;
    default:
      return "INVITED" as const;
  }
};

export async function actionCreateTrip(input: CreateTripInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to create a trip");
  }

  const payload: TablesInsert<"trip"> = {
    id: input.id,
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("trip")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTripRow(data);
}

export async function actionUpsertRemoteTripFromLocal(input: CreateTripInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a trip");
  }

  const payload: TablesInsert<"trip"> = {
    id: input.id,
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("trip")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTripRow(data);
}

export async function actionSoftDeleteRemoteTrip(tripId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a trip");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("trip")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", tripId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemotePinFromLocal(input: CreatePinInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a pin");
  }

  const payload = {
    id: input.id,
    trip_id: input.tripId,
    user_id: user.id,
    name: input.name.trim(),
    start_date: input.startDate,
    start_time: input.allDay ? null : input.startTime?.trim() || null,
    end_date: input.endDate,
    end_time: input.allDay ? null : input.endTime?.trim() || null,
    all_day: input.allDay,
    category_id: input.categoryId,
    metadata_json: input.metadataJson,
  };

  const { data, error } = await supabase
    .from("pin")
    .upsert(payload)
    .select(
      "id, trip_id, user_id, name, start_date, start_time, end_date, end_time, all_day, category_id, metadata_json, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapPinRow(data);
}

export async function actionSoftDeleteRemotePin(pinId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a pin");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("pin")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", pinId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteChecklistItemFromLocal(
  input: CreateChecklistItemInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a checklist item");
  }

  const payload: TablesInsert<"checklist_item"> = {
    id: input.id,
    trip_id: input.tripId,
    user_id: user.id,
    title: input.title.trim(),
    completed: input.completed,
  };

  const { data, error } = await supabase
    .from("checklist_item")
    .upsert(payload)
    .select(
      "id, trip_id, user_id, title, completed, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapChecklistItemRow(data);
}

export async function actionSoftDeleteRemoteChecklistItem(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a checklist item");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("checklist_item")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteNoteFromLocal(input: CreateNoteInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a note");
  }

  const normalizedText = input.text.trim();

  if (!normalizedText) {
    throw new Error("Note cannot be empty");
  }

  const payload: TablesInsert<"note"> = {
    id: input.id,
    pin_id: input.pinId,
    user_id: user.id,
    text: normalizedText,
  };

  const { data, error } = await supabase
    .from("note")
    .upsert(payload)
    .select("id, pin_id, user_id, text, created_at, updated_at, deleted_at")
    .single();

  if (error) {
    throw error;
  }

  return mapNoteRow(data);
}

export async function actionSoftDeleteRemoteNote(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a note");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("note")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteReferenceLinkFromLocal(
  input: CreateReferenceLinkInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a reference link");
  }

  const payload: TablesInsert<"reference_link"> = {
    id: input.id,
    pin_id: input.pinId,
    user_id: user.id,
    title: input.title,
    url: input.url.trim(),
    caption: input.caption,
  };

  const { data, error } = await supabase
    .from("reference_link")
    .upsert(payload)
    .select(
      "id, pin_id, user_id, title, url, caption, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapReferenceLinkRow(data);
}

export async function actionSoftDeleteRemoteReferenceLink(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a reference link");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("reference_link")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteExpenseFromLocal(
  input: CreateExpenseInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync an expense");
  }

  const payload: TablesInsert<"expense"> = {
    id: input.id,
    pin_id: input.pinId,
    trip_id: input.tripId,
    user_id: user.id,
    description: input.description.trim(),
    amount: input.amount,
    currency: input.currency.trim(),
    paid_by_user_id: input.paidByUserId,
    paid_by_name: input.paidByName.trim(),
  };

  const { data, error } = await supabase
    .from("expense")
    .upsert(payload)
    .select(
      "id, pin_id, trip_id, user_id, description, amount, currency, paid_by_user_id, paid_by_name, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapExpenseRow(data);
}

export async function actionSoftDeleteRemoteExpense(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete an expense");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("expense")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteDocumentFromLocal(
  input: CreateDocumentInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync a document");
  }

  const payload: TablesInsert<"document"> = {
    id: input.id,
    trip_id: input.tripId,
    pin_id: input.pinId,
    user_id: user.id,
    file_name: input.fileName.trim(),
    mime_type: input.mimeType.trim(),
    storage_bucket: input.storageBucket.trim(),
    storage_path: input.storagePath.trim(),
    caption: input.caption,
  };

  const { data, error } = await supabase
    .from("document")
    .upsert(payload)
    .select(
      "id, trip_id, pin_id, user_id, file_name, mime_type, storage_bucket, storage_path, caption, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapDocumentRow(data);
}

export async function actionSoftDeleteRemoteDocument(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a document");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("document")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionUpsertRemoteImageFromLocal(input: CreateImageInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to sync an image");
  }

  const payload: TablesInsert<"image"> = {
    id: input.id,
    pin_id: input.pinId,
    trip_id: input.tripId,
    user_id: user.id,
    storage_bucket: input.storageBucket.trim(),
    storage_path: input.storagePath.trim(),
    mime_type: input.mimeType.trim(),
    width: input.width,
    height: input.height,
    caption: input.caption,
  };

  const { data, error } = await supabase
    .from("image")
    .upsert(payload)
    .select(
      "id, pin_id, trip_id, user_id, storage_bucket, storage_path, mime_type, width, height, caption, created_at, updated_at, deleted_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapImageRow(data);
}

export async function actionSoftDeleteRemoteImage(id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete an image");
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("image")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actionSignUpWithEmail(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        username: input.username.trim().toLowerCase(),
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function actionListPublicUsers(searchQuery: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to search users");
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  let query = supabase
    .from("user")
    .select("id, username, created_at, updated_at")
    .order("username", { ascending: true })
    .limit(20);

  if (normalizedQuery) {
    query = query.ilike("username", `%${normalizedQuery}%`);
  }

  const { data, error } = await query;

  console.log("users:", data);

  if (error) {
    throw error;
  }

  return data.map(mapPublicUserRow);
}

export async function actionCreateTripInvitation(
  input: CreateTripInvitationInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to invite a companion");
  }

  const { data, error } = await supabase
    .from("trip_invitation")
    .insert({
      trip_id: input.tripId,
      inviter_user_id: user.id,
      invitee_user_id: input.inviteeUserId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function actionListTripInvitationsByTrip(tripId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to view trip invitations");
  }

  const { data, error } = await supabase
    .from("trip_invitation")
    .select(
      "id, trip_id, inviter_user_id, invitee_user_id, status, created_at, updated_at, responded_at",
    )
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const inviteeIds = Array.from(
    new Set(data.map((item) => item.invitee_user_id)),
  );

  if (inviteeIds.length === 0) {
    return [];
  }

  const { data: invitees, error: inviteesError } = await supabase
    .from("user")
    .select("id, username, created_at, updated_at")
    .in("id", inviteeIds);

  if (inviteesError) {
    throw inviteesError;
  }

  const inviteeMap = new Map(invitees.map((invitee) => [invitee.id, invitee]));

  return data
    .map((invitation) => {
      const invitee = inviteeMap.get(invitation.invitee_user_id);

      if (!invitee) {
        return null;
      }

      return {
        id: invitation.id,
        fullname: invitee.username,
        state: mapTripInvitationStatus(invitation.status),
      };
    })
    .filter(
      (invitation): invitation is NonNullable<typeof invitation> =>
        invitation !== null,
    );
}

export async function actionListAcceptedCompanionTrips() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to view shared trips");
  }

  const { data: invitations, error: invitationsError } = await supabase
    .from("trip_invitation")
    .select("trip_id, invitee_user_id, status")
    .eq("invitee_user_id", user.id)
    .eq("status", "accepted");

  if (invitationsError) {
    throw invitationsError;
  }

  const tripIds = Array.from(
    new Set(invitations.map((invitation) => invitation.trip_id)),
  );

  if (tripIds.length === 0) {
    return [];
  }

  const { data: trips, error: tripsError } = await supabase
    .from("trip")
    .select("id, title, start_date, end_date, created_at, updated_at")
    .in("id", tripIds)
    .is("deleted_at", null);

  if (tripsError) {
    throw tripsError;
  }

  return trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    startDate: trip.start_date,
    endDate: trip.end_date,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    location: "Shared trip",
    companions: [],
    pins: [],
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  }));
}

export async function actionGetRemoteTripById(tripId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to view a trip");
  }

  const { data, error } = await supabase
    .from("trip")
    .select(
      "id, user_id, title, start_date, end_date, created_at, updated_at, deleted_at",
    )
    .eq("id", tripId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    startDate: data.start_date,
    endDate: data.end_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}

export async function actionGetRemotePinById(pinId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in to view a pin");
  }

  const { data, error } = await supabase
    .from("pin")
    .select(
      "id, trip_id, user_id, name, start_date, start_time, end_date, end_time, all_day, category_id, metadata_json, created_at, updated_at, deleted_at",
    )
    .eq("id", pinId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return mapPinRow(data);
}

export async function actionSignInWithEmail(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return data;
}
