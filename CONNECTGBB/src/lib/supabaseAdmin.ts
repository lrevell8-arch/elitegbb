import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdminClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

export const supabaseAdmin = supabaseAdminClient;

export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    throw new Error("Supabase admin client is not configured.");
  }
  return supabaseAdminClient;
}
