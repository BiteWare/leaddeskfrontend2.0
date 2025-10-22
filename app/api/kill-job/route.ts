import { NextRequest, NextResponse } from "next/server";
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

    // Get environment variables inside the function to avoid build-time evaluation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Update the job status to 'cancelled'
    const { data, error } = await supabase
      .from("enrichment_jobs")
      .update({ overall_job_status: "cancelled" })
      .eq("correlation_id", correlation_id)
      .select()
      .single();

    if (error) {
      console.error("Error killing job:", error);
      return NextResponse.json(
        { error: "Failed to kill job", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
      job: data,
    });
  } catch (error) {
    console.error("Error in kill-job API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
