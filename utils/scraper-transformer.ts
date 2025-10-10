/**
 * Centralized transformer for scraper output to LeadData format
 * This ensures consistent transformation across the entire application
 */

import type { LeadData } from '@/components/lead-view'
import { parseScraperWorkerResults, extractScraperMetadata } from './scraper-parser'

export interface JobInputData {
  input_customer_name?: string | null
  input_street_address?: string | null
  input_city?: string | null
  input_state?: string | null
}

/**
 * Transforms scraper output directly to LeadData format
 * This is the SINGLE SOURCE OF TRUTH for transformation logic
 * 
 * @param scraperWorkerResultsJson - The raw scraper results from the database
 * @param jobInputData - Optional job input data to use as fallback for missing fields
 */
export function transformScraperOutputToLeadData(
  scraperWorkerResultsJson: any, 
  jobInputData?: JobInputData
): LeadData {
  // Parse the scraper output from the database
  const scraperOutput = parseScraperWorkerResults(scraperWorkerResultsJson)
  
  console.log('🔧 Transformer - Parsed scraper output:', scraperOutput)
  console.log('🔧 Transformer - Job input data:', jobInputData)
  console.log('🔧 Available fields:', Object.keys(scraperOutput || {}))
  
  // Build fallback address from job input
  const fallbackAddress = jobInputData ? [
    jobInputData.input_street_address,
    jobInputData.input_city,
    jobInputData.input_state
  ].filter(Boolean).join(', ') : 'Address not available'
  
  if (!scraperOutput) {
    return {
      practiceName: jobInputData?.input_customer_name || 'Unknown Practice',
      practiceAddress: fallbackAddress,
      practiceSpecialty: 'General Practice',
      numberOfDentists: 0,
      numberOfHygienists: 0,
      specialties: [],
      staff: [],
      locations: [],
      resultingUrl: undefined,
      personInCharge: undefined,
      worksMultipleLocations: undefined,
      scrapeNotes: undefined,
    }
  }

  // Count staff by role
  const dentists = scraperOutput.staff_list?.filter((s: any) => 
    s.role?.toLowerCase().includes('dentist') || 
    s.role?.toLowerCase().includes('dds') || 
    s.role?.toLowerCase().includes('dmd')
  ) || []
  
  const hygienists = scraperOutput.staff_list?.filter((s: any) => 
    s.role?.toLowerCase().includes('hygienist')
  ) || []

  // Transform locations
  let locations = scraperOutput.locations?.map((loc: any, index: number) => ({
    id: (index + 1).toString(),
    name: loc.name || `Location ${index + 1}`,
    address: loc.address || '',
    phone: loc.phone || '',
    email: loc.email || '',
    manager: loc.manager || 'Unknown',
    staffCount: loc.staff_at_location?.length || 0,
    state: loc.state || 'Unknown'
  })) || []

  // If no locations from scraper but we have job input data, create a location entry
  if (locations.length === 0 && jobInputData) {
    const inputAddress = [
      jobInputData.input_street_address,
      jobInputData.input_city,
      jobInputData.input_state
    ].filter(Boolean).join(', ')
    
    if (inputAddress) {
      locations = [{
        id: '1',
        name: jobInputData.input_customer_name || 'Main Office',
        address: inputAddress,
        phone: '',
        email: '',
        manager: 'Unknown',
        staffCount: 0,
        state: jobInputData.input_state || 'Unknown'
      }]
    }
  }

  // Transform staff
  const staff: any[] = []
  
  // Add person in charge first
  if (scraperOutput.person_in_charge) {
    staff.push({
      name: scraperOutput.person_in_charge.name,
      role: scraperOutput.person_in_charge.role,
      credentials: scraperOutput.person_in_charge.credentials,
      location: 'Main Office',
      phone: undefined,
      email: undefined
    })
  }

  // Add all staff from staff_list
  if (scraperOutput.staff_list) {
    scraperOutput.staff_list.forEach((member: any) => {
      staff.push({
        name: member.name,
        role: member.role,
        credentials: member.credentials,
        location: undefined,
        phone: undefined,
        email: undefined
      })
    })
  }

  // Add staff from locations
  if (scraperOutput.locations) {
    scraperOutput.locations.forEach((location: any) => {
      if (location.staff_at_location) {
        location.staff_at_location.forEach((member: any) => {
          staff.push({
            name: member.name,
            role: member.role,
            credentials: member.credentials,
            location: location.name,
            phone: undefined,
            email: undefined
          })
        })
      }
    })
  }

  // Build full address from job input as fallback
  const fallbackFullAddress = jobInputData ? [
    jobInputData.input_street_address,
    jobInputData.input_city,
    jobInputData.input_state
  ].filter(Boolean).join(', ') : 'Address not available'

  return {
    practiceName: scraperOutput.practice_name || jobInputData?.input_customer_name || 'Unknown Practice',
    practiceAddress: locations[0]?.address || scraperOutput.locations?.[0]?.address || fallbackFullAddress,
    practiceWebsite: scraperOutput.resulting_url || scraperOutput.website || undefined,
    practicePhone: scraperOutput.phone || undefined,
    practiceEmail: scraperOutput.email || undefined,
    practiceSpecialty: scraperOutput.practice_specialties?.join(', ') || 'General Practice',
    numberOfDentists: dentists.length,
    numberOfHygienists: hygienists.length,
    specialties: scraperOutput.practice_specialties || [],
    staff: staff,
    locations: locations,
    // Add scraper metadata
    resultingUrl: scraperOutput.resulting_url,
    personInCharge: scraperOutput.person_in_charge,
    worksMultipleLocations: scraperOutput.works_multiple_locations,
    scrapeNotes: scraperOutput.scrape_notes
  }
}

