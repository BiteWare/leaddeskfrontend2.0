"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Search } from "lucide-react"
import type { EnrichmentJob } from '@/types/database.types'

interface JobsTableProps {
  jobs: EnrichmentJob[]
  showCreatedBy?: boolean
}

export function JobsTable({ jobs, showCreatedBy = false }: JobsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  console.log('🔍 JobsTable received jobs:', { 
    count: jobs.length, 
    jobs: jobs.map(j => ({ 
      correlation_id: j.correlation_id, 
      input_customer_name: j.input_customer_name, 
      overall_job_status: j.overall_job_status 
    }))
  })

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs

    const query = searchQuery.toLowerCase()
    return jobs.filter(job => {
      const practiceName = job.input_customer_name?.toLowerCase() || ''
      const address = `${job.input_street_address || ''} ${job.input_city || ''} ${job.input_state || ''}`.toLowerCase()
      const jobId = job.correlation_id?.toLowerCase() || ''
      
      return practiceName.includes(query) || 
             address.includes(query) || 
             jobId.includes(query)
    })
  }, [jobs, searchQuery])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 60000)

    return () => clearInterval(interval)
  }, [router])

  // Helper to check if a job is stale (stuck in processing for too long)
  const isJobStale = (job: EnrichmentJob): boolean => {
    const processingStates = ['pending_url_search', 'url_worker_called', 'scraper_worker_called', 'queued', 'in_progress']
    
    if (!job.overall_job_status || !processingStates.includes(job.overall_job_status)) {
      return false
    }
    
    if (!job.created_at) {
      return false
    }
    
    const createdAt = new Date(job.created_at)
    const now = new Date()
    const ageInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    // Consider jobs stale if they've been processing for more than 10 minutes
    return ageInMinutes > 10
  }

  const getStatusBadge = (status: string | null, job: EnrichmentJob) => {
    // Override status display if job is stale
    if (isJobStale(job)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertCircle className="h-3 w-3" />
          Timed Out
        </Badge>
      )
    }
    
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      'pending_url_search': {
        label: 'Finding Website',
        variant: 'secondary',
        icon: <Loader2 className="h-3 w-3 animate-spin" />
      },
      'url_worker_called': {
        label: 'URL Search Started',
        variant: 'secondary',
        icon: <Loader2 className="h-3 w-3 animate-spin" />
      },
      'url_worker_complete': {
        label: 'Website Found',
        variant: 'outline',
        icon: <Clock className="h-3 w-3" />
      },
      'scraper_worker_called': {
        label: 'Analyzing Website',
        variant: 'secondary',
        icon: <Loader2 className="h-3 w-3 animate-spin" />
      },
      'scraper_worker_complete': {
        label: 'Completed',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      'failed': {
        label: 'Failed',
        variant: 'destructive',
        icon: <XCircle className="h-3 w-3" />
      },
      'expired': {
        label: 'Expired',
        variant: 'destructive',
        icon: <AlertCircle className="h-3 w-3" />
      },
      'cancelled': {
        label: 'Cancelled',
        variant: 'outline',
        icon: <XCircle className="h-3 w-3" />
      },
      'queued': {
        label: 'Queued',
        variant: 'secondary',
        icon: <Clock className="h-3 w-3" />
      },
      'in_progress': {
        label: 'In Progress',
        variant: 'secondary',
        icon: <Loader2 className="h-3 w-3 animate-spin" />
      }
    }

    const config = statusMap[status || 'unknown'] || {
      label: status || 'Unknown',
      variant: 'outline' as const,
      icon: <Clock className="h-3 w-3" />
    }

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const isClickable = (status: string | null) => {
    return status === 'scraper_worker_complete'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  }

  const handleRowClick = (job: EnrichmentJob) => {
    if (isClickable(job.overall_job_status)) {
      router.push(`/results/${job.correlation_id}`)
    }
  }

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCreatedBy ? 4 : 3} className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No jobs match your search' : 'No jobs found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow
                  key={job.correlation_id}
                  onClick={() => handleRowClick(job)}
                  className={
                    isClickable(job.overall_job_status)
                      ? "cursor-pointer hover:bg-muted/50 transition-colors"
                      : ""
                  }
                >
                  <TableCell className="font-medium">
                    {job.input_customer_name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.overall_job_status, job)}
                  </TableCell>
                  {showCreatedBy && (
                    <TableCell className="text-muted-foreground">
                      {job.users?.email || 'Unknown'}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {formatDate(job.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
