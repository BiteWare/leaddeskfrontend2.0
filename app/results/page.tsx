"use client";

import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebarCustom } from "@/components/app-sidebar-custom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { EnrichmentJob } from "@/types/database.types";
import { JobResultsClient } from "./[id]/job-results-client";
import { supabase } from "@/utils/supabase-client";

export default function ResultsListPage() {
  const [userJobs, setUserJobs] = useState<EnrichmentJob[]>([]);
  const [allJobs, setAllJobs] = useState<EnrichmentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("✅ User authenticated, fetching jobs...", {
          userId: user.id,
          userEmail: user.email,
        });

        // Fetch all jobs (RLS will need to be adjusted to allow viewing all jobs)
        const { data: allJobsData, error: allJobsError } = await supabase
          .from("enrichment_jobs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        console.log("📊 Raw jobs data:", {
          count: allJobsData?.length,
          sample: allJobsData?.[0],
        });

        // Fetch user emails from API endpoint
        let userEmails: Record<string, string> = {};
        try {
          const userEmailsResponse = await fetch("/api/get-job-users");
          const data = await userEmailsResponse.json();
          userEmails = data.userEmails || {};
          console.log("📊 User emails fetched:", {
            count: Object.keys(userEmails).length,
          });
        } catch (error) {
          console.warn("⚠️ Failed to fetch user emails:", error);
        }

        // Enrich jobs with user email - use current user's email for their jobs
        const currentUserEmail = user.email || "Unknown";
        const enrichedAllJobs =
          allJobsData?.map((job) => ({
            ...job,
            users: job.run_user_id
              ? {
                  email:
                    job.run_user_id === user.id
                      ? currentUserEmail
                      : userEmails[job.run_user_id] ||
                        job.run_user_id.substring(0, 8) + "...",
                }
              : null,
          })) || [];

        console.log("📊 All jobs query result:", {
          count: enrichedAllJobs.length,
          error: allJobsError?.message,
          enrichedSample: enrichedAllJobs[0],
        });

        // Filter for current user's jobs
        const myJobsData = enrichedAllJobs.filter(
          (job) => job.run_user_id === user.id,
        );

        console.log("📊 My jobs query result:", {
          count: myJobsData.length,
          userId: user.id,
        });

        setAllJobs(enrichedAllJobs as EnrichmentJob[]);
        setUserJobs(myJobsData as EnrichmentJob[]);
      } else {
        console.log("❌ No user found");
      }
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebarCustom />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          {/* Header Bar */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-white">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">All Results</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </header>

          {/* Main Content */}
          <div className="p-8 space-y-6">
            <JobResultsClient
              userJobs={userJobs}
              allJobs={allJobs}
              correlationId={undefined}
              onRefresh={fetchJobs}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
