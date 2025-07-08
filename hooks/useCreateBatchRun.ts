import { useState } from 'react'
import { supabase } from '@/utils/supabase-client'
import type { BatchRun, BatchRunInsert } from '@/types/database.types'

interface UseCreateBatchRunReturn {
  createBatchRun: (userId: string, filename: string, meta?: Record<string, any>) => Promise<BatchRun | null>
  loading: boolean
  error: string | null
}

export function useCreateBatchRun(): UseCreateBatchRunReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBatchRun = async (
    userId: string, 
    filename: string, 
    meta?: Record<string, any>
  ): Promise<BatchRun | null> => {
    if (!userId || !filename) {
      setError('User ID and filename are required')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const batchRunData: BatchRunInsert = {
        user_id: userId,
        filename,
        status: 'pending',
        meta: meta || null
      }

      const { data, error: insertError } = await supabase
        .from('batch_runs')
        .insert(batchRunData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create batch run'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createBatchRun,
    loading,
    error
  }
} 