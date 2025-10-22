import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Lazy client initialization to avoid build-time errors
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = new Proxy(
  {} as ReturnType<typeof createClient<Database>>,
  {
    get(target, prop) {
      // Initialize client on first access (only in browser)
      if (!_supabaseClient && typeof window !== "undefined") {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
      }

      // Return the property from the initialized client
      if (_supabaseClient) {
        return (_supabaseClient as any)[prop];
      }

      // During SSR/build, return a no-op to prevent errors
      return () => {};
    },
  },
);
