"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebarCustom } from "@/components/app-sidebar-custom";
import Searchbar from "@/components/Searchbar";
import JobErrorDisplay from "@/components/job-error-display";
import { JobLoader } from "@/components/job-loader";
import { useUsers } from "@/hooks/useUsers";
import { useLeadJobStatus } from "@/hooks/useLeadJobStatus";
import { detectExclusion } from "@/utils/domain-detector";

export default function HomePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const { user } = useUsers();
  const router = useRouter();
  const jobStatus = useLeadJobStatus();

  const handleSearch = async (query: string) => {
    setIsSubmitting(true);
    setShowError(false);
    jobStatus.reset(); // Reset any previous job status

    // Track start time for minimum loading duration
    const startTime = Date.now();
    const minLoadingDuration = 1500; // minimum 1.5 seconds loading display

    try {
      // STEP 1: Extract practice name from query (before address/digits)
      let practiceName = query.trim();
      const match = practiceName.match(/^(.*?)(\d.*)$/);
      if (match) {
        practiceName = match[1].trim();
      }

      // STEP 2: Check for DSO or EDU exclusion BEFORE backend submission
      console.log("🔍 Checking for exclusions:", { practiceName, query });
      const exclusionResult = detectExclusion(practiceName, query);

      if (exclusionResult.isExcluded) {
        console.log("🚫 Exclusion detected:", exclusionResult);

        // Create a mock "excluded" job and store locally
        const excludedJobId = `excluded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const excludedJob = {
          id: excludedJobId,
          exclusionType: exclusionResult.exclusionType,
          dsoName: exclusionResult.dsoName,
          practiceName,
          query,
          detectedDomain: exclusionResult.detectedDomain,
          reason: exclusionResult.reason,
          timestamp: new Date().toISOString(),
        };

        // Store in localStorage for retrieval on results page
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `excluded_job_${excludedJobId}`,
            JSON.stringify(excludedJob),
          );
        }

        // Ensure minimum loading time before redirect
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingDuration - elapsed);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        // Redirect to results page with excluded job
        setIsSubmitting(false);
        router.push(`/results/${excludedJobId}`);
        return; // Exit early - DO NOT submit to backend
      }

      // STEP 3: No exclusion - proceed with normal backend submission
      let accessToken = undefined;
      if (user) {
        const {
          data: { session },
        } = await import("@/utils/supabase-client").then((m) =>
          m.supabase.auth.getSession(),
        );
        accessToken = session?.access_token;
      }

      const response = await fetch("/api/search-practices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Search failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.success && data.correlation_id) {
        // Successfully submitted - start polling and redirect to results page
        console.log(
          "Job submitted successfully, correlation_id:",
          data.correlation_id,
        );

        // Ensure minimum loading time before transitioning
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingDuration - elapsed);

        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        // Start polling and redirect to results page
        jobStatus.startPolling(data.correlation_id);
        setIsSubmitting(false); // Reset submitting state
        router.push(`/results/${data.correlation_id}`);
      } else {
        // API returned success:false or no correlation_id - this is a submission error
        const errorMessage = data.error || "Failed to submit enrichment job";

        // Ensure minimum loading time before showing error
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingDuration - elapsed);

        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        setShowError(true);
        setIsSubmitting(false);
      }
    } catch (error) {
      // Network error or API completely failed - this is a submission error
      console.error("Search error:", error);

      // Ensure minimum loading time before showing error
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      setShowError(true);
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setShowError(false);
    setIsSubmitting(false);
    jobStatus.reset();
  };

  const handleCancelJob = () => {
    jobStatus.stopPolling();
  };

  return (
    <SidebarProvider>
      <AppSidebarCustom />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
          {/* Header Bar */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center px-8 py-8">
            <div className="w-full flex flex-col items-center justify-start pt-64">
              <Searchbar onSearch={handleSearch} />

              {isSubmitting && (
                <div className="mt-4 text-center">
                  <JobLoader className="mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Submitting enrichment job...
                  </p>
                </div>
              )}

              {/* Simple job status display */}
              {jobStatus.correlationId && !isSubmitting && (
                <div className="mt-4 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="text-center">
                        <p className="text-green-800 font-medium text-sm">
                          Job Submitted Successfully
                        </p>
                        <p className="text-green-600 text-xs mt-1">
                          Your enrichment job has been queued. Check the Results
                          page for updates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show error only if submission failed */}
              {showError && <JobErrorDisplay onRetry={handleRetry} />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
