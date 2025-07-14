import type { PracticeScrape } from '@/types/database.types'

/**
 * Normalize an address by removing extra spaces, converting to lowercase, and standardizing format
 * @param address - The address string to normalize
 * @returns string - The normalized address
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[.,]/g, '') // Remove common punctuation
}

/**
 * Build a full address string from individual components
 * @param street - Street address
 * @param city - City
 * @param state - State
 * @param zip - ZIP code
 * @returns string - The complete address string
 */
export function buildFullAddress(
  street?: string,
  city?: string,
  state?: string,
  zip?: string
): string {
  const parts = [street, city, state, zip].filter(Boolean)
  return parts.join(', ')
}

/**
 * Check if a practice scrape is fresh (within the specified time window)
 * @param scrapedAt - The timestamp when the data was scraped
 * @param maxAgeHours - Maximum age in hours (default: 24)
 * @returns boolean - True if the data is fresh, false otherwise
 */
export function isScrapeFresh(scrapedAt: string, maxAgeHours: number = 24): boolean {
  const scrapedDate = new Date(scrapedAt)
  const now = new Date()
  const ageInHours = (now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60)
  return ageInHours < maxAgeHours
}

/**
 * Check if a practice scrape is valid and fresh
 * @param scrape - The practice scrape data
 * @param maxAgeHours - Maximum age in hours (default: 24)
 * @returns boolean - True if the scrape is valid and fresh
 */
export function isValidFreshScrape(
  scrape: PracticeScrape | null,
  maxAgeHours: number = 24
): boolean {
  if (!scrape) return false
  if (!scrape.scrape_data) return false
  return isScrapeFresh(scrape.scrape_datetime, maxAgeHours)
}

/**
 * Create a cache key for a practice based on name and address
 * @param practiceName - The practice name
 * @param fullAddress - The full address
 * @returns string - A unique cache key
 */
export function createPracticeCacheKey(practiceName: string, fullAddress: string): string {
  const normalizedName = practiceName.toLowerCase().trim()
  const normalizedAddress = normalizeAddress(fullAddress)
  return `${normalizedName}|${normalizedAddress}`
}

/**
 * Extract address components from a full address string
 * @param fullAddress - The complete address string
 * @returns object - Object containing street, city, state, and zip
 */
export function parseAddress(fullAddress: string): {
  street?: string
  city?: string
  state?: string
  zip?: string
} {
  const parts = fullAddress.split(',').map(part => part.trim())
  
  if (parts.length === 0) return {}
  
  // Simple parsing logic - can be enhanced based on your address format
  const street = parts[0] || undefined
  const city = parts[1] || undefined
  
  // Handle state and zip (usually in format "State ZIP")
  let state: string | undefined
  let zip: string | undefined
  
  if (parts[2]) {
    const stateZip = parts[2].split(' ')
    if (stateZip.length >= 2) {
      state = stateZip[0]
      zip = stateZip[1]
    } else {
      state = parts[2]
    }
  }
  
  return { street, city, state, zip }
}

/**
 * Build input address from individual components for the new schema
 * @param street - Street address
 * @param city - City
 * @param state - State
 * @returns string - The complete input address string
 */
export function buildInputAddress(
  street?: string,
  city?: string,
  state?: string
): string {
  const parts = [street, city, state].filter(Boolean)
  return parts.join(', ')
} 