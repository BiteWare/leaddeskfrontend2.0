import { createRouteHandlerClient } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.LEADDESK_DISPATCHER_WEBHOOK_URL!;

    // Get user ID for job association
    const supabase = createRouteHandlerClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Please sign in to submit jobs",
        }),
        { status: 401 },
      );
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err }), {
      status: 500,
    });
  }
}
