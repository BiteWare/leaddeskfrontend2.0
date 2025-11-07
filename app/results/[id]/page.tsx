"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LeadView, { type LeadData } from "@/components/lead-view";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebarCustom } from "@/components/app-sidebar-custom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { transformScraperOutputToLeadData } from "@/utils/scraper-transformer";
import { useJobData } from "@/hooks/useJobData";
import { StepProgression } from "@/components/step-progression";

function getStatusBadge(status: string, createdAt: string | null) {
  // Check if job is stale (stuck in processing for too long)
  const isJobStale = (): boolean => {
    const processingStates = [
      "pending_url_search",
      "url_worker_called",
      "scraper_worker_called",
      "queued",
      "in_progress",
    ];

    if (!processingStates.includes(status)) {
      return false;
    }

    if (!createdAt) {
      return false;
    }

    const created = new Date(createdAt);
    const now = new Date();
    const ageInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);

    // Consider jobs stale if they've been processing for more than 10 minutes
    return ageInMinutes > 10;
  };

  // Override status if job is stale
  if (isJobStale()) {
    return <Badge variant="destructive">Timed Out</Badge>;
  }

  const statusMap: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    pending_url_search: {
      label: "Finding Website",
      variant: "secondary",
    },
    url_worker_called: {
      label: "URL Search Started",
      variant: "secondary",
    },
    url_worker_complete: {
      label: "Website Found",
      variant: "outline",
    },
    scraper_worker_called: {
      label: "Analyzing Website",
      variant: "secondary",
    },
    scraper_worker_complete: {
      label: "Completed",
      variant: "default",
    },
    failed: {
      label: "Failed",
      variant: "destructive",
    },
    expired: {
      label: "Expired",
      variant: "destructive",
    },
    cancelled: {
      label: "Cancelled",
      variant: "outline",
    },
  };

  const config = statusMap[status] || {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface ExcludedJob {
  id: string;
  exclusionType: "DSO" | "EDU";
  dsoName?: string;
  practiceName: string;
  query: string;
  detectedDomain?: string;
  reason?: string;
  timestamp: string;
}

export default function ResultsPage() {
  const params = useParams();
  // Decode URL parameter and clean it
  const rawId = params.id as string;
  const correlationId = decodeURIComponent(rawId).replace(/^=/, "");

  console.log("🆔 Raw URL param:", rawId);
  console.log("🆔 Cleaned correlation_id:", correlationId);

  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [excludedJob, setExcludedJob] = useState<ExcludedJob | null>(null);

  // Check if this is an excluded job (ID starts with "excluded_")
  const isExcludedJob = correlationId.startsWith("excluded_");

  // Load excluded job from localStorage if applicable
  useEffect(() => {
    if (isExcludedJob && typeof window !== "undefined") {
      const storedJob = localStorage.getItem(`excluded_job_${correlationId}`);
      if (storedJob) {
        try {
          const parsed = JSON.parse(storedJob);
          console.log("🚫 Loaded excluded job from localStorage:", parsed);
          setExcludedJob(parsed);
        } catch (error) {
          console.error("Failed to parse excluded job:", error);
        }
      }
    }
  }, [correlationId, isExcludedJob]);

  // Use the hook to fetch job data from database (skip if excluded job)
  const { job, loading, error, refetch } = useJobData(
    isExcludedJob ? "" : correlationId,
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500); // Show refresh animation briefly
  };

  useEffect(() => {
    console.log("🎯 useEffect triggered, job:", {
      hasJob: !!job,
      status: job?.overall_job_status,
      hasResults: !!job?.scraper_worker_results_json,
    });

    if (
      job?.overall_job_status === "scraper_worker_complete" &&
      job.scraper_worker_results_json
    ) {
      console.log(
        "🔍 Raw scraper_worker_results_json:",
        job.scraper_worker_results_json,
      );

      try {
        // Transform scraper output directly to LeadData using centralized transformer
        // Pass job input data for fallback values
        const transformedData = transformScraperOutputToLeadData(
          job.scraper_worker_results_json,
          {
            input_customer_name: job.input_customer_name,
            input_street_address: job.input_street_address,
            input_city: job.input_city,
            input_state: job.input_state,
          },
        );
        console.log("📊 Transformed lead data:", transformedData);

        if (transformedData) {
          setLeadData(transformedData);
          console.log("✅ LeadData set successfully!");
        } else {
          console.error("❌ Transformer returned null/undefined");
        }
      } catch (error) {
        console.error("❌ Error transforming data:", error);
      }
    } else {
      console.log("⚠️ Condition not met:", {
        statusMatch: job?.overall_job_status === "scraper_worker_complete",
        hasResults: !!job?.scraper_worker_results_json,
      });
    }
  }, [job]);

  // Handle excluded jobs first (DSO/EDU)
  if (isExcludedJob && excludedJob) {
    return (
      <SidebarProvider>
        <AppSidebarCustom currentJobUrl={`/results/${correlationId}`} />
        <SidebarInset>
          <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header Bar */}
            <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b bg-white">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg font-semibold">Job Results</h1>

              <div className="flex-1 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Practice:</span>
                  <span className="font-medium">
                    {excludedJob.practiceName}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <Badge variant="destructive">{excludedJob.exclusionType}</Badge>
              </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
              <LeadView
                leadData={null}
                exclusionType={excludedJob.exclusionType}
                exclusionDetails={{
                  dsoName: excludedJob.dsoName,
                  domain: excludedJob.detectedDomain,
                  reason: excludedJob.reason,
                  practiceName: excludedJob.practiceName,
                  query: excludedJob.query,
                }}
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show initial loading spinner only when actively loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  // Show error only if there's an actual error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  // If no job data yet, show step progression (waiting for webhook to create job)
  // This is normal and not an error - the webhook just hasn't responded yet
  return (
    <SidebarProvider>
      <AppSidebarCustom currentJobUrl={`/results/${correlationId}`} />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          {/* Header Bar */}
          <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b bg-white">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Job Results</h1>

            {/* Job Status Info in Header - only show if job exists */}
            {job && (
              <>
                <div className="flex-1 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Practice:</span>
                    <span className="font-medium">
                      {job.input_customer_name}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Job ID:</span>
                    <span className="font-mono text-xs">
                      {job.correlation_id}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  {getStatusBadge(
                    job.overall_job_status || "unknown",
                    job.created_at,
                  )}
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {job.created_at
                        ? new Date(job.created_at).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </>
            )}

            {/* If no job yet, show waiting message */}
            {!job && (
              <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                <span>Waiting for job to be created...</span>
              </div>
            )}
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-8">
            {/* Results Display */}
            {job?.overall_job_status === "scraper_worker_complete" &&
            leadData ? (
              <LeadView leadData={leadData} />
            ) : (
              <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <StepProgression
                  isComplete={
                    job?.overall_job_status === "scraper_worker_complete"
                  }
                />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
