import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/utils/supabase-client'
import type { EnrichmentJob } from '@/types/database.types'

export interface UseJobDataReturn {
  job: EnrichmentJob | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Helper to check if job is in terminal state
const isJobComplete = (status: string | null): boolean => {
  if (!status) return false
  return ['scraper_worker_complete', 'failed', 'expired', 'cancelled'].includes(status)
}

export function useJobData(correlationId: string): UseJobDataReturn {
  const [job, setJob] = useState<EnrichmentJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialFetch = useRef(true)

  const fetchJob = useCallback(async () => {
    if (!correlationId) {
      setError('Correlation ID is required')
      setLoading(false)
      return
    }

    try {
      // Only show loading on initial fetch
      if (isInitialFetch.current) {
        setLoading(true)
      }
      setError(null)
      
      console.log('🔍 Fetching job data for correlation ID:', correlationId)
      
      // First, check if ANY jobs exist for debugging
      const { data: allJobs, error: allJobsError } = await supabase
        .from('enrichment_jobs')
        .select('correlation_id, overall_job_status')
        .limit(5)
      
      console.log('📋 Sample jobs in database:', allJobs)
      console.log('📋 Total jobs accessible:', allJobs?.length || 0)
      
      const { data: jobData, error: jobError } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('correlation_id', correlationId)
        .maybeSingle()
        
      console.log('🔍 Query for correlation_id:', correlationId)
      console.log('🔍 Full job data from database:', jobData)
      console.log('🔍 Job error:', jobError)

      if (jobError) {
        console.error('❌ Database query error:', jobError)
        throw new Error(jobError.message)
      }

      if (jobData) {
        setJob(jobData)
        console.log('📊 Job data received:', {
          correlation_id: jobData.correlation_id,
          status: jobData.overall_job_status,
          hasResults: !!jobData.scraper_worker_results_json,
          hasUrlResults: !!jobData.url_worker_results_json,
          urlWorkerId: jobData.url_worker_job_id,
          scraperWorkerId: jobData.scraper_worker_job_id,
          resultingUrl: jobData.url_worker_resulting_url,
          created_at: jobData.created_at
        })
        
        console.log('🔍 DETAILED STATUS CHECK:', {
          currentStatus: jobData.overall_job_status,
          isComplete: isJobComplete(jobData.overall_job_status),
          terminalStates: ['scraper_worker_complete', 'failed', 'expired', 'cancelled'],
          scraperResultsType: typeof jobData.scraper_worker_results_json,
          scraperResultsKeys: jobData.scraper_worker_results_json ? Object.keys(jobData.scraper_worker_results_json) : 'null'
        })
        
        // Stop polling if job is complete
        if (isJobComplete(jobData.overall_job_status)) {
          console.log('✅ Job complete, stopping polling')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else {
          console.log('⚠️ Job NOT complete - still in state:', jobData.overall_job_status)
        }
      } else {
        console.warn('⚠️ No job found with correlation_id:', correlationId)
        setError('Job not found')
      }
    } catch (err) {
      console.error('❌ Error fetching job data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch job data')
    } finally {
      setLoading(false)
      isInitialFetch.current = false
    }
  }, [correlationId])

  useEffect(() => {
    // Initial fetch
    fetchJob()
    
    // Set up polling interval - poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      console.log('⏱️ Polling for job updates...')
      fetchJob()
    }, 5000)
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [fetchJob])

  return {
    job,
    loading,
    error,
    refetch: fetchJob
  }
}
