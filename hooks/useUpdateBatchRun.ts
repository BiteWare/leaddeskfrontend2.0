import { useState } from 'react'
import { supabase } from '@/utils/supabase-client'
import type { BatchRunUpdate } from '@/types/database.types'

interface UseUpdateBatchRunReturn {
  updateBatchRun: (id: string, updates: BatchRunUpdate) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useUpdateBatchRun(): UseUpdateBatchRunReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBatchRun = async (id: string, updates: BatchRunUpdate): Promise<boolean> => {
    if (!id) {
      setError('Batch run ID is required')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('batch_runs')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update batch run'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    updateBatchRun,
    loading,
    error
  }
} 