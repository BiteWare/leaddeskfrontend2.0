import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Helper to get environment variables (lazily evaluated)
const getEnvVars = () => ({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

// Client-side Supabase client (lazy initialization)
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (typeof window !== "undefined") {
    // Only create client on the browser side
    if (!_supabaseClient) {
      const { supabaseUrl, supabaseAnonKey } = getEnvVars();
      _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return _supabaseClient!;
  }
  // On server side, create a new client each time (or use dummy values if env vars missing)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Export as named property for backward compatibility
export const supabase = getSupabaseClient();

// Server-side Supabase client for Server Components
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (request: Request) => {
  const response = new Response();
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = request.headers.get("cookie");
        return cookies
          ? cookies.split(";").map((cookie) => {
              const [name, value] = cookie.trim().split("=");
              return { name, value };
            })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.headers.append(
            "Set-Cookie",
            `${name}=${value}; ${Object.entries(options || {})
              .map(([key, val]) => `${key}=${val}`)
              .join("; ")}`,
          );
        });
      },
    },
  });
};
