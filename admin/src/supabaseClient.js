import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure them in the deployment environment."
  );
}

/**
 * Compatibility/backup Supabase client.
 *
 * The dashboard currently imports the typed client from ./lib/supabase.ts.
 * Keep this file available for legacy components or future modules that
 * expect a JavaScript-style supabaseClient.js import.
 *
 * Never place the Supabase service_role key in this file.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
