import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// Backend Admin Client with service role permissions
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
