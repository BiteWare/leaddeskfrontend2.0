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

    // First, check if the job exists and get its current status
    const { data: existingJob, error: fetchError } = await supabase
      .from("enrichment_jobs")
      .select("overall_job_status")
      .eq("correlation_id", correlation_id)
      .single();

    if (fetchError || !existingJob) {
      console.error("Error fetching job:", fetchError);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const activeStates = [
      "pending_url_search",
      "url_worker_called",
      "scraper_worker_called",
      "queued",
      "in_progress",
    ];

    // If job is in an active state, cancel it. Otherwise, delete it.
    if (
      existingJob.overall_job_status &&
      activeStates.includes(existingJob.overall_job_status)
    ) {
      // Cancel active job by updating status
      const { data, error } = await supabase
        .from("enrichment_jobs")
        .update({ overall_job_status: "cancelled" })
        .eq("correlation_id", correlation_id)
        .select()
        .single();

      if (error) {
        console.error("Error cancelling job:", error);
        return NextResponse.json(
          { error: "Failed to cancel job", details: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Job cancelled successfully",
        job: data,
      });
    } else {
      // Delete completed/failed job
      const { error } = await supabase
        .from("enrichment_jobs")
        .delete()
        .eq("correlation_id", correlation_id);

      if (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json(
          { error: "Failed to delete job", details: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Job deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error in kill-job API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
