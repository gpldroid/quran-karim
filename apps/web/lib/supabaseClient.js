import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tqmjueqdfdyhiukhbant.supabase.co";

// This is a Supabase publishable key. It is intentionally safe for browser use.
// Authorization is enforced by Supabase Auth + Postgres RLS, not by hiding this key.
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_xfJu5T9gZ4UsysK6LxWcFQ_FkG6nmbh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export const publicDb = supabase.schema("public");

export async function checkAdmin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAdmin: false,
      error: userError || new Error("لا توجد جلسة مصادق عليها."),
    };
  }

  const { data, error: adminError } = await publicDb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { isAdmin: false, error: adminError, user };
  }

  return {
    isAdmin: Boolean(data),
    error: null,
    user,
  };
}

export function subscribeToTable(table, callback) {
  return supabase
    .channel("dashboard-" + table)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      callback
    )
    .subscribe();
}
