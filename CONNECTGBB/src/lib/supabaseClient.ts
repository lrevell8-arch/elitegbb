import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
}
