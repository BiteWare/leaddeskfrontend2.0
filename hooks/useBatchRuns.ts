import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase-client'
import type { BatchRun } from '@/types/database.types'

interface UseBatchRunsReturn {
  batchRuns: BatchRun[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBatchRuns(userId: string): UseBatchRunsReturn {
  const [batchRuns, setBatchRuns] = useState<BatchRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatchRuns = async () => {
    if (!userId) {
      setBatchRuns([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('batch_runs')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setBatchRuns(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch runs')
      setBatchRuns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatchRuns()
  }, [userId])

  return {
    batchRuns,
    loading,
    error,
    refetch: fetchBatchRuns
  }
} 