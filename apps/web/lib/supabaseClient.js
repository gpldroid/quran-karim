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
    return { isAdmin: false, error: userError || new Error("لا توجد جلسة مصادق عليها.") };
  }

  const { data, error } = await supabase.rpc("is_admin");

  if (!error) {
    return { isAdmin: data === true, error: null, user };
  }

  // PGRST202 means PostgREST's schema cache cannot currently see the RPC.
  // Keep RPC as the primary authorization path, but use the user's own
  // admin row as a temporary compatibility fallback instead of blocking
  // an otherwise valid login while the schema cache catches up.
  if (error.code === "PGRST202") {
    const { data: adminRow, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminError && adminRow?.user_id === user.id) {
      return {
        isAdmin: true,
        error: null,
        user,
        warning: "RPC schema cache unavailable; authorization verified from admin_users.",
      };
    }
  }

  return { isAdmin: false, error, user };
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
