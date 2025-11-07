import { createRouteHandlerClient } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      correlation_id,
      practice_name,
      query,
      exclusion_type,
      exclusion_reason,
      detected_domain,
      dso_name,
    } = body;

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

    // Parse the query to extract address components (similar to backend logic)
    const addressMatch = query.match(/^(.*?)(\d.*)$/);
    let streetAddress = "";
    let city = "";
    let state = "";

    if (addressMatch) {
      const addressPart = addressMatch[2].trim();
      // Simple parsing - you may want to improve this
      const parts = addressPart.split(",").map((p: string) => p.trim());

      if (parts.length >= 1) {
        streetAddress = parts[0];
      }
      if (parts.length >= 2) {
        city = parts[1];
      }
      if (parts.length >= 3) {
        // Extract state from "State ZIP" format
        const stateZip = parts[2].split(" ");
        state = stateZip[0];
      }
    }

    // Create excluded job entry in database
    const { data, error } = await supabase
      .from("enrichment_jobs")
      .insert({
        correlation_id,
        run_user_id: user.id,
        input_customer_name: practice_name,
        input_street_address: streetAddress || query,
        input_city: city || "",
        input_state: state || "",
        overall_job_status: "excluded",
        cohort: exclusion_type === "DSO" ? "DSO" : exclusion_type === "EDU" ? "Education" : "Government",
        exclusion_reason: exclusion_reason,
        url_worker_resulting_url: detected_domain || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving excluded job:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Exception saving excluded job:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
}
