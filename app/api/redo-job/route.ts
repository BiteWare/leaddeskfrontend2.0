import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function POST(request: NextRequest) {
  try {
    const { correlation_id } = await request.json();

    if (!correlation_id) {
      return NextResponse.json(
        { error: "correlation_id is required" },
        { status: 400 },
      );
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to resubmit jobs" },
        { status: 401 },
      );
    }

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create Supabase client with service key to fetch any job
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Fetch the original job to get the input data
    const { data: originalJob, error: fetchError } = await supabaseAdmin
      .from("enrichment_jobs")
      .select(
        "input_customer_name, input_street_address, input_city, input_state",
      )
      .eq("correlation_id", correlation_id)
      .single();

    if (fetchError || !originalJob) {
      console.error("Error fetching job:", fetchError);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Prepare the webhook payload with the original job data
    // The webhook will create a new job associated with the current user
    const webhookPayload = {
      input_customer_name: originalJob.input_customer_name,
      input_street_address: originalJob.input_street_address,
      input_city: originalJob.input_city,
      input_state: originalJob.input_state,
      run_user_id: user.id, // Include user ID so new job is associated with current user
    };

    // Call the n8n webhook to resubmit the job
    const webhookUrl = process.env.LEADDESK_WEBHOOK_URL!;
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      console.error("Error calling webhook:", webhookResponse.statusText);
      return NextResponse.json(
        { error: "Failed to resubmit job to workflow" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job resubmitted successfully",
      data: webhookPayload,
    });
  } catch (error) {
    console.error("Error in redo-job API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
