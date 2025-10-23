"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EnrichmentJob } from "@/types/database.types";

interface JobsTableProps {
  jobs: EnrichmentJob[];
  showCreatedBy?: boolean;
}

export function JobsTable({ jobs, showCreatedBy = false }: JobsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [jobToKill, setJobToKill] = useState<string | null>(null);
  const [killingJob, setKillingJob] = useState<string | null>(null);
  const [jobToRedo, setJobToRedo] = useState<string | null>(null);
  const [redoingJob, setRedoingJob] = useState<string | null>(null);

  console.log("🔍 JobsTable received jobs:", {
    count: jobs.length,
    jobs: jobs.map((j) => ({
      correlation_id: j.correlation_id,
      input_customer_name: j.input_customer_name,
      overall_job_status: j.overall_job_status,
    })),
  });

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;

    const query = searchQuery.toLowerCase();
    return jobs.filter((job) => {
      const practiceName = job.input_customer_name?.toLowerCase() || "";
      const address =
        `${job.input_street_address || ""} ${job.input_city || ""} ${job.input_state || ""}`.toLowerCase();
      const jobId = job.correlation_id?.toLowerCase() || "";

      return (
        practiceName.includes(query) ||
        address.includes(query) ||
        jobId.includes(query)
      );
    });
  }, [jobs, searchQuery]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  // Helper to check if a job is stale (stuck in processing for too long)
  const isJobStale = (job: EnrichmentJob): boolean => {
    const processingStates = [
      "pending_url_search",
      "url_worker_called",
      "scraper_worker_called",
      "queued",
      "in_progress",
    ];

    if (
      !job.overall_job_status ||
      !processingStates.includes(job.overall_job_status)
    ) {
      return false;
    }

    if (!job.created_at) {
      return false;
    }

    const createdAt = new Date(job.created_at);
    const now = new Date();
    const ageInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    // Consider jobs stale if they've been processing for more than 10 minutes
    return ageInMinutes > 10;
  };

  const getStatusBadge = (status: string | null, job: EnrichmentJob) => {
    // Override status display if job is stale
    if (isJobStale(job)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertCircle className="h-3 w-3" />
          Timed Out
        </Badge>
      );
    }

    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
      }
    > = {
      pending_url_search: {
        label: "Finding Website",
        variant: "secondary",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      url_worker_called: {
        label: "URL Search Started",
        variant: "secondary",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      url_worker_complete: {
        label: "Website Found",
        variant: "outline",
        icon: <Clock className="h-3 w-3" />,
      },
      scraper_worker_called: {
        label: "Analyzing Website",
        variant: "secondary",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      scraper_worker_complete: {
        label: "Completed",
        variant: "default",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      failed: {
        label: "Failed",
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
      expired: {
        label: "Expired",
        variant: "destructive",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      cancelled: {
        label: "Cancelled",
        variant: "outline",
        icon: <XCircle className="h-3 w-3" />,
      },
      queued: {
        label: "Queued",
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
      in_progress: {
        label: "In Progress",
        variant: "secondary",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
    };

    const config = statusMap[status || "unknown"] || {
      label: status || "Unknown",
      variant: "outline" as const,
      icon: <Clock className="h-3 w-3" />,
    };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const isClickable = (status: string | null) => {
    return status === "scraper_worker_complete";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const handleRowClick = (job: EnrichmentJob) => {
    if (isClickable(job.overall_job_status)) {
      router.push(`/results/${job.correlation_id}`);
    }
  };

  // Check if a job can be killed/deleted
  // All jobs can now be deleted regardless of state
  const isKillable = (status: string | null): boolean => {
    // Don't allow deleting jobs that are already cancelled or expired
    const nonKillableStates = ["cancelled", "expired"];
    return status ? !nonKillableStates.includes(status) : true;
  };

  // Handle kill/delete job action
  const handleKillJob = async (correlationId: string) => {
    setKillingJob(correlationId);

    try {
      const response = await fetch("/api/kill-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correlation_id: correlationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete job");
      }

      const result = await response.json();

      // Refresh the page to show updated status or removed job
      router.refresh();
    } catch (error) {
      console.error("Error deleting job:", error);
      alert(
        "Failed to delete job. Please try again or contact support if the issue persists.",
      );
    } finally {
      setKillingJob(null);
      setJobToKill(null);
    }
  };

  // Check if a job can be redone
  const isRedoable = (status: string | null, job: EnrichmentJob): boolean => {
    // Allow redo for failed, cancelled, expired jobs, or jobs that timed out
    const redoableStates = ["failed", "cancelled", "expired"];
    return (
      (status ? redoableStates.includes(status) : false) || isJobStale(job)
    );
  };

  // Handle redo job action
  const handleRedoJob = async (correlationId: string) => {
    setRedoingJob(correlationId);

    try {
      const response = await fetch("/api/redo-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correlation_id: correlationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to redo job");
      }

      const result = await response.json();

      // Show success message
      alert(
        `Job resubmitted successfully! A new job has been created for ${result.data?.input_customer_name || "this practice"}.`,
      );

      // Refresh the page to show the new job
      router.refresh();
    } catch (error) {
      console.error("Error redoing job:", error);
      alert("Failed to resubmit job. Please try again.");
    } finally {
      setRedoingJob(null);
      setJobToRedo(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by practice name, address, or job ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Practice Info</TableHead>
              <TableHead>Status</TableHead>
              {showCreatedBy && <TableHead>Created By</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showCreatedBy ? 5 : 4}
                  className="text-center text-muted-foreground py-8"
                >
                  {searchQuery ? "No jobs match your search" : "No jobs found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow
                  key={job.correlation_id}
                  className={
                    isClickable(job.overall_job_status)
                      ? "hover:bg-muted/50 transition-colors"
                      : ""
                  }
                >
                  <TableCell
                    className="font-medium cursor-pointer"
                    onClick={() => handleRowClick(job)}
                  >
                    {job.input_customer_name}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleRowClick(job)}
                  >
                    {getStatusBadge(job.overall_job_status, job)}
                  </TableCell>
                  {showCreatedBy && (
                    <TableCell
                      className="text-muted-foreground cursor-pointer"
                      onClick={() => handleRowClick(job)}
                    >
                      {job.users?.email || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell
                    className="text-muted-foreground cursor-pointer"
                    onClick={() => handleRowClick(job)}
                  >
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isKillable(job.overall_job_status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJobToKill(job.correlation_id);
                          }}
                          disabled={killingJob === job.correlation_id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {killingJob === job.correlation_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {isRedoable(job.overall_job_status, job) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJobToRedo(job.correlation_id);
                          }}
                          disabled={redoingJob === job.correlation_id}
                          className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          {redoingJob === job.correlation_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Kill/Delete Job Confirmation Dialog */}
      <AlertDialog
        open={!!jobToKill}
        onOpenChange={(open) => !open && setJobToKill(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {jobToKill &&
              jobs.find((j) => j.correlation_id === jobToKill)
                ?.overall_job_status &&
              [
                "pending_url_search",
                "url_worker_called",
                "scraper_worker_called",
                "queued",
                "in_progress",
              ].includes(
                jobs.find((j) => j.correlation_id === jobToKill)!
                  .overall_job_status!,
              )
                ? "Cancel Job?"
                : "Delete Job?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {jobToKill &&
              jobs.find((j) => j.correlation_id === jobToKill)
                ?.overall_job_status &&
              [
                "pending_url_search",
                "url_worker_called",
                "scraper_worker_called",
                "queued",
                "in_progress",
              ].includes(
                jobs.find((j) => j.correlation_id === jobToKill)!
                  .overall_job_status!,
              )
                ? "Are you sure you want to cancel this job? This action cannot be undone. The job will be marked as cancelled and will stop processing."
                : "Are you sure you want to delete this job? This action cannot be undone. All job data will be permanently removed from the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => jobToKill && handleKillJob(jobToKill)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {jobToKill &&
              jobs.find((j) => j.correlation_id === jobToKill)
                ?.overall_job_status &&
              [
                "pending_url_search",
                "url_worker_called",
                "scraper_worker_called",
                "queued",
                "in_progress",
              ].includes(
                jobs.find((j) => j.correlation_id === jobToKill)!
                  .overall_job_status!,
              )
                ? "Yes, cancel job"
                : "Yes, delete job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Redo Job Confirmation Dialog */}
      <AlertDialog
        open={!!jobToRedo}
        onOpenChange={(open) => !open && setJobToRedo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resubmit Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new job with the same practice information as
              the original job. The original job data will remain unchanged. Are
              you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => jobToRedo && handleRedoJob(jobToRedo)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Yes, resubmit job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
