import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Redo-job API called");
    const { correlation_id } = await request.json();

    if (!correlation_id) {
      return NextResponse.json(
        { error: "correlation_id is required" },
        { status: 400 },
      );
    }

    // Try to get authenticated user, but don't require it
    // The user ID will be included in webhook if available
    const supabase = createRouteHandlerClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("👤 User authenticated:", !!user, user?.id);

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
    // Include user ID if available so new job is associated with current user
    const webhookPayload: {
      input_customer_name: string | null;
      input_street_address: string | null;
      input_city: string | null;
      input_state: string | null;
      run_user_id?: string;
    } = {
      input_customer_name: originalJob.input_customer_name,
      input_street_address: originalJob.input_street_address,
      input_city: originalJob.input_city,
      input_state: originalJob.input_state,
    };

    // Only include run_user_id if user is authenticated
    if (user) {
      webhookPayload.run_user_id = user.id;
      console.log("✅ Including user ID in webhook payload:", user.id);
    } else {
      console.log(
        "⚠️ No user authenticated, job will be created without user association",
      );
    }

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
