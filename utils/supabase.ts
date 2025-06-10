import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client for Server Components
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side Supabase client for Route Handlers
export const createRouteHandlerClient = (request: Request) => {
  const response = new Response()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = request.headers.get('cookie')
          return cookies ? cookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          }) : []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append('Set-Cookie', `${name}=${value}; ${Object.entries(options || {}).map(([key, val]) => `${key}=${val}`).join('; ')}`)
          })
        },
      },
    }
  )
} 