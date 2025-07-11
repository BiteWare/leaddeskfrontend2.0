import { createRouteHandlerClient } from '@/utils/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.LEADDESK_WEBHOOK_URL!;

    // Try to get the access token from the Authorization header
    const authHeader = req.headers.get('authorization');
    let user = null;
    let authError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.getUser(accessToken);
      user = data.user;
      authError = error;
    } else {
      // Fallback to cookie-based auth
      const supabase = createRouteHandlerClient(req);
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      authError = error;
    }

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Authentication required" 
      }), { status: 401 });
    }

    // Include user_id in the payload
    const payloadWithUserId = {
      user_id: user.id,
      ...body
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithUserId),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err }), { status: 500 });
  }
} 