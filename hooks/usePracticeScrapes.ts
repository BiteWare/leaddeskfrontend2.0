import { useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase-client'
import type { PracticeScrape, PracticeScrapeInsert, PracticeScrapeUpdate } from '@/types/database.types'

interface UsePracticeScrapesReturn {
  getPracticeScrape: (practiceName: string, fullAddress: string) => Promise<PracticeScrape | null>
  upsertPracticeScrape: (data: PracticeScrapeInsert) => Promise<PracticeScrape | null>
  getPracticeScrapesForBatch: (batchId: string) => Promise<PracticeScrape[]>
  loading: boolean
  error: string | null
}

/**
 * Hook for managing practice scrapes (cached lead enrichment results)
 */
export function usePracticeScrapes(): UsePracticeScrapesReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch a cached practice scrape by practice name and full address
   * @param practiceName - The name of the practice
   * @param fullAddress - The complete address string
   * @returns Promise<PracticeScrape | null> - The cached scrape data or null if not found
   */
  const getPracticeScrape = useCallback(async (
    practiceName: string, 
    fullAddress: string
  ): Promise<PracticeScrape | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('practice_scrapes')
        .select('*')
        .eq('practice_name', practiceName)
        .eq('full_address', fullAddress)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch practice scrape'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Insert or update a practice scrape with results
   * @param data - The practice scrape data to insert/update
   * @returns Promise<PracticeScrape | null> - The created/updated scrape data
   */
  const upsertPracticeScrape = useCallback(async (
    data: PracticeScrapeInsert
  ): Promise<PracticeScrape | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: upsertError } = await supabase
        .from('practice_scrapes')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'practice_name,full_address'
        })
        .select()
        .single()

      if (upsertError) {
        throw upsertError
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upsert practice scrape'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch all practice scrapes for a specific batch
   * @param batchId - The batch run ID
   * @returns Promise<PracticeScrape[]> - Array of practice scrapes for the batch
   */
  const getPracticeScrapesForBatch = useCallback(async (
    batchId: string
  ): Promise<PracticeScrape[]> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('practice_scrapes')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch batch practice scrapes'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getPracticeScrape,
    upsertPracticeScrape,
    getPracticeScrapesForBatch,
    loading,
    error
  }
} 