import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

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

  // Browser authorization deliberately uses the authenticated user's own
  // admin_users row instead of depending on PostgREST's RPC schema cache.
  // This avoids blocking login when the database function exists but the
  // REST schema cache is stale.
  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { isAdmin: false, error: adminError, user };
  }

  return {
    isAdmin: adminRow?.user_id === user.id,
    error: null,
    user,
  };
}

export function subscribeToTable(table, callback) {
  const channel = supabase
    .channel("dashboard-" + table)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      callback
    )
    .subscribe();

  return channel;
}
