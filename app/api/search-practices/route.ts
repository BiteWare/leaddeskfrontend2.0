import { createRouteHandlerClient } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { checkMasterExclusion } from "@/utils/master-exclusion-checker";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, address } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Company name is required",
        }),
        { status: 400 },
      );
    }

    // Get user ID from Authorization header
    const authHeader = req.headers.get("authorization");
    console.log("🔍 API Auth check:", {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20),
    });

    let user = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.replace("Bearer ", "");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.getUser(accessToken);
      user = data.user;
      console.log("🔍 Bearer token auth result:", {
        user: user?.id,
        error: error?.message,
      });
    }

    if (!user) {
      console.log("❌ No user found, returning 401");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Please sign in to submit jobs",
        }),
        { status: 401 },
      );
    }

    console.log("✅ User authenticated:", user.id);

    // Backend validation: Check for exclusions before submitting to n8n
    // This prevents bypassing client-side exclusion checks
    let companyName = query.trim();
    const nameMatch = companyName.match(/^(.*?)(\d.*)$/);
    if (nameMatch) {
      companyName = nameMatch[1].trim();
    }

    const exclusionCheck = checkMasterExclusion(companyName, query);

    if (exclusionCheck.isExcluded) {
      console.log("🚫 Backend exclusion check failed:", exclusionCheck);
      return new Response(
        JSON.stringify({
          success: false,
          error: `This practice type is excluded: ${exclusionCheck.reason}`,
          exclusion: {
            category: exclusionCheck.category,
            reason: exclusionCheck.reason,
            matchedPattern: exclusionCheck.matchedPattern,
            detectedDomain: exclusionCheck.detectedDomain,
            dsoName: exclusionCheck.dsoName,
          },
        }),
        { status: 400 },
      );
    }

    console.log("✅ Exclusion check passed, proceeding with submission");

    // Submit enrichment job to n8n dispatcher
    const dispatcherUrl = process.env.LEADDESK_DISPATCHER_WEBHOOK_URL;

    console.log("🔧 Environment check:", {
      hasDispatcherUrl: !!dispatcherUrl,
      urlLength: dispatcherUrl?.length,
      urlPreview: dispatcherUrl?.substring(0, 30) + "...",
    });

    if (!dispatcherUrl) {
      console.error("❌ LEADDESK_DISPATCHER_WEBHOOK_URL not set");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Dispatcher webhook URL not configured. Please check environment variables.",
        }),
        { status: 500 },
      );
    }

    // Try to split query into name + address
    // companyName already declared above for exclusion check
    let addr = address || "";

    // If no explicit address, attempt to split query by first digit
    if (!addr) {
      const match = companyName.match(/^(.*?)(\d.*)$/);
      if (match) {
        companyName = match[1].trim();
        addr = match[2].trim();
      }
    }

    // Submit job to n8n dispatcher
    console.log("Submitting job to dispatcher:", {
      companyName,
      address: addr,
      user_id: user.id,
    });

    // Create AbortController with 6-minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6 * 60 * 1000); // 6 minutes

    try {
      const dispatcherResponse = await fetch(dispatcherUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          address: addr,
          user_id: user.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Dispatcher response status:", dispatcherResponse.status);

      if (!dispatcherResponse.ok) {
        const errorText = await dispatcherResponse.text();
        console.error("Dispatcher error response:", errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to submit enrichment job: ${dispatcherResponse.status} ${dispatcherResponse.statusText}`,
          }),
          { status: 500 },
        );
      }

      const dispatcherData = await dispatcherResponse.json();
      console.log("Dispatcher response data:", dispatcherData);

      // Expect response format: { status: "accepted", correlation_id: "uuid" }
      if (
        !dispatcherData ||
        dispatcherData.status !== "accepted" ||
        !dispatcherData.correlation_id
      ) {
        console.error("Invalid dispatcher response format:", dispatcherData);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Invalid response from dispatcher. Expected { status: 'accepted', correlation_id: 'uuid' }",
          }),
          { status: 500 },
        );
      }

      // Return the correlation_id for polling
      return new Response(
        JSON.stringify({
          success: true,
          correlation_id: dispatcherData.correlation_id,
          status: "submitted",
          message: "Enrichment job submitted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle timeout error specifically
      if (fetchError.name === "AbortError") {
        console.error("Dispatcher request timeout after 6 minutes");
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Request timeout: The enrichment job submission took too long. Please try again.",
          }),
          { status: 504 },
        );
      }

      // Re-throw other errors to be caught by outer try-catch
      throw fetchError;
    }
  } catch (err) {
    console.error("Search API error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500 },
    );
  }
}
