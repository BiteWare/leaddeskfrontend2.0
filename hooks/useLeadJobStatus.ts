import { useState, useCallback, useRef, useEffect } from 'react'
import { useUsers } from './useUsers'

export interface JobStatus {
  status: string
  message: string
  data?: any
  created_at?: string
}

export interface UseLeadJobStatusReturn {
  // State
  isPolling: boolean
  currentStatus: string
  statusMessage: string
  correlationId: string | null
  jobData: any | null
  error: string | null
  
  // Actions
  startPolling: (correlationId: string) => void
  stopPolling: () => void
  reset: () => void
  
  // Status checks
  isCompleted: boolean
  isFailed: boolean
  isProcessing: boolean
}

export function useLeadJobStatus(): UseLeadJobStatusReturn {
  const { user } = useUsers()
  const [isPolling, setIsPolling] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [correlationId, setCorrelationId] = useState<string | null>(null)
  const [jobData, setJobData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const checkJobStatus = useCallback(async (correlationId: string): Promise<JobStatus | null> => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      // Get the Supabase access token
      let accessToken = undefined
      const { data: { session } } = await import('@/utils/supabase-client').then(m => m.supabase.auth.getSession())
      accessToken = session?.access_token

      const response = await fetch("/api/check-job-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ correlation_id: correlationId }),
        signal: abortControllerRef.current?.signal
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found')
        } else if (response.status === 401) {
          throw new Error('Authentication required')
        } else {
          throw new Error(`Status check failed: ${response.status} ${response.statusText}`)
        }
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Status check failed')
      }

      return {
        status: result.status,
        message: result.message || getDefaultStatusMessage(result.status),
        data: result.data,
        created_at: result.created_at
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null // Request was cancelled
      }
      throw err
    }
  }, [user?.id])

  const startPolling = useCallback((correlationId: string) => {
    if (!correlationId) {
      setError('Correlation ID is required')
      return
    }

    // Clean up any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setCorrelationId(correlationId)
    setIsPolling(true)
    setError(null)
    setJobData(null)
    setCurrentStatus('')
    setStatusMessage('Job submitted, checking status...')

    // Create new abort controller for this polling session
    abortControllerRef.current = new AbortController()

    // Don't poll - just show job submitted state
    setCurrentStatus('submitted')
    setStatusMessage('Job submitted successfully. Waiting for completion...')
    
    // Stop polling immediately - we'll let the user manually refresh
    setIsPolling(false)
  }, [checkJobStatus])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stopPolling()
    setCurrentStatus('')
    setStatusMessage('')
    setCorrelationId(null)
    setJobData(null)
    setError(null)
  }, [stopPolling])

  // Status helpers
  const isCompleted = currentStatus === 'completed' || currentStatus === 'scraper_worker_complete'
  const isFailed = ['failed', 'expired', 'cancelled'].includes(currentStatus)
  const isProcessing = isPolling && !isCompleted && !isFailed

  return {
    isPolling,
    currentStatus,
    statusMessage,
    correlationId,
    jobData,
    error,
    startPolling,
    stopPolling,
    reset,
    isCompleted,
    isFailed,
    isProcessing
  }
}

// Helper functions
function isJobComplete(status: string): boolean {
  return ['completed', 'scraper_worker_complete'].includes(status)
}

function isJobFailed(status: string): boolean {
  return ['failed', 'expired', 'cancelled'].includes(status)
}

function getDefaultStatusMessage(status: string): string {
  switch (status) {
    case 'pending_url_search':
      return 'Finding company website...'
    case 'url_worker_called':
      return 'URL search in progress...'
    case 'url_worker_complete':
      return 'Website found, preparing to analyze...'
    case 'scraper_worker_called':
      return 'Analyzing website content...'
    case 'scraper_worker_complete':
      return 'Enrichment completed successfully!'
    case 'failed':
      return 'Enrichment failed. Please try again.'
    case 'expired':
      return 'Job expired. Please try again.'
    case 'cancelled':
      return 'Job was cancelled.'
    case 'queued':
      return 'Job is queued...'
    case 'in_progress':
      return 'Job is in progress...'
    default:
      return 'Processing...'
  }
}
