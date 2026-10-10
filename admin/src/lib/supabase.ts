import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dzjkizwjcgdhqnegmluj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6amtpendqY2dkaHFuZWdtbHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDkzOTUsImV4cCI6MjEwNzEyNTM5NX0.vnQn50EAkUH7lFbnIMvJOuK6l8DxxqKQtZBwx5qSyuM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
