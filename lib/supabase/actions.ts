import { supabase } from "./client";
import { type Tables, type TablesInsert } from "./types";

export type CreateTripInput = {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
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
    .in("id", tripIds);

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
