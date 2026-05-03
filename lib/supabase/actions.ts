import { supabase } from "./client";
import { type Tables, type TablesInsert } from "./types";

export type CreateTripInput = {
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

export type TripRow = Tables<"trip">;
export type PublicUserRow = Tables<"user">;

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
