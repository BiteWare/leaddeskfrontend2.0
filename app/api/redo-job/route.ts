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
    const webhookUrl = process.env.LEADDESK_DISPATCHER_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(
        "❌ LEADDESK_DISPATCHER_WEBHOOK_URL environment variable not configured",
      );
      return NextResponse.json(
        { error: "Webhook URL not configured. Please contact administrator." },
        { status: 500 },
      );
    }

    console.log("🌐 Calling webhook:", webhookUrl);
    console.log("📦 Webhook payload:", JSON.stringify(webhookPayload, null, 2));

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    console.log("📡 Webhook response status:", webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse
        .text()
        .catch(() => "Unknown error");
      console.error("❌ Error calling webhook:", webhookResponse.statusText);
      console.error("❌ Webhook error details:", errorText);
      return NextResponse.json(
        {
          error: "Failed to resubmit job to workflow",
          details: errorText,
          status: webhookResponse.status,
        },
        { status: 500 },
      );
    }

    console.log("✅ Webhook called successfully");

    // Delete the original job to avoid duplicates in the table
    console.log("🗑️ Deleting original job:", correlation_id);
    const { error: deleteError } = await supabaseAdmin
      .from("enrichment_jobs")
      .delete()
      .eq("correlation_id", correlation_id);

    if (deleteError) {
      console.error("⚠️ Failed to delete original job:", deleteError);
      // Don't fail the whole request if we can't delete the original
      // The new job was already created successfully
    } else {
      console.log("✅ Original job deleted");
    }

    return NextResponse.json({
      success: true,
      message: "Job resubmitted successfully",
      data: webhookPayload,
    });
  } catch (error) {
    console.error("❌ Error in redo-job API:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
