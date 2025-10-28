/**
 * Cohort Classification Utility
 *
 * Automatically classifies dental practice leads into cohorts based on
 * practice name, domain, and specialty information.
 *
 * Classification uses first-match-wins logic in priority order:
 * 1. Dealers
 * 2. Government
 * 3. Education
 * 4. Clinic
 * 5. Pediatric
 * 6. DSO (placeholder)
 * 7. Uncategorized (fallback)
 */

export type CohortType =
  | 'Dealers'
  | 'Government'
  | 'Education'
  | 'Clinic'
  | 'Pediatric'
  | 'DSO'
  | 'Uncategorized'

export interface CohortClassificationInput {
  practiceName?: string | null
  resultingUrl?: string | null
  specialties?: string[] | null
  groupName?: string | null
}

/**
 * Extracts domain from a URL string
 * @param url - Full URL string
 * @returns Domain name or empty string
 */
function extractDomain(url: string | null | undefined): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Checks if a string contains any of the given keywords (case-insensitive)
 * @param text - Text to search in
 * @param keywords - Keywords to search for
 * @returns True if any keyword is found
 */
function containsKeyword(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false

  const lowerText = text.toLowerCase()
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

/**
 * Checks if specialty list contains any of the given specialties (case-insensitive)
 * @param specialties - Array of specialties
 * @param targetSpecialties - Specialties to search for
 * @returns True if any specialty matches
 */
function hasSpecialty(specialties: string[] | null | undefined, targetSpecialties: string[]): boolean {
  if (!specialties || specialties.length === 0) return false

  const lowerSpecialties = specialties.map(s => s.toLowerCase())
  return targetSpecialties.some(target =>
    lowerSpecialties.some(s => s.includes(target.toLowerCase()))
  )
}

/**
 * Checks if practice is a general dentistry practice
 * Used to exclude general practices from pediatric classification
 * @param specialties - Array of specialties
 * @returns True if practice is general dentistry
 */
function isGeneralDentistry(specialties: string[] | null | undefined): boolean {
  if (!specialties || specialties.length === 0) return false

  return hasSpecialty(specialties, ['General Dentistry', 'General Practice'])
}

/**
 * Classifies a lead into a cohort based on practice information
 *
 * Uses first-match-wins logic:
 * - Dealers: Group name contains "Dealers"
 * - Government: .gov domain
 * - Education: Group name includes "US Schools"
 * - Clinic: Name includes foundation/community/CHC OR specialty = "Public Health"
 * - Pediatric: Name includes pediatric keywords OR specialty = "Pediatric Dentistry" (excluding general dentistry)
 * - DSO: Placeholder for future exclusion list
 * - Uncategorized: Default fallback
 *
 * @param input - Practice information for classification
 * @returns Cohort type
 */
export function classifyCohort(input: CohortClassificationInput): CohortType {
  const { practiceName, resultingUrl, specialties, groupName } = input

  console.log('🏷️ Classifying cohort for:', {
    practiceName,
    resultingUrl,
    specialties,
    groupName
  })

  // Rule 1: Dealers - group name contains "Dealers"
  if (containsKeyword(groupName, ['Dealers'])) {
    console.log('✅ Matched: Dealers (group name)')
    return 'Dealers'
  }

  // Rule 2: Government - .gov domain
  const domain = extractDomain(resultingUrl)
  if (domain.endsWith('.gov')) {
    console.log('✅ Matched: Government (.gov domain)')
    return 'Government'
  }

  // Rule 3: Education - group name includes "US Schools"
  if (containsKeyword(groupName, ['US Schools'])) {
    console.log('✅ Matched: Education (US Schools)')
    return 'Education'
  }

  // Rule 4: Clinic - name includes foundation/community/CHC OR specialty = "Public Health"
  const clinicKeywords = ['foundation', 'community', 'chc']
  if (containsKeyword(practiceName, clinicKeywords) || hasSpecialty(specialties, ['Public Health'])) {
    console.log('✅ Matched: Clinic (foundation/community/CHC or Public Health)')
    return 'Clinic'
  }

  // Rule 5: Pediatric - name includes pediatric keywords OR specialty = "Pediatric Dentistry"
  // BUT exclude if it's a general dentistry practice
  const pediatricKeywords = ['kids', 'pediatric', 'children', 'sugarbug']
  const hasPediatricName = containsKeyword(practiceName, pediatricKeywords)
  const hasPediatricSpecialty = hasSpecialty(specialties, ['Pediatric Dentistry', 'Pediatrics'])

  if ((hasPediatricName || hasPediatricSpecialty) && !isGeneralDentistry(specialties)) {
    console.log('✅ Matched: Pediatric (pediatric keywords or specialty, not general)')
    return 'Pediatric'
  }

  // Rule 6: DSO - placeholder for future exclusion list
  // TODO: Implement DSO exclusion list integration
  // For now, this will never match

  // Rule 7: Uncategorized - default fallback
  console.log('⚪ Matched: Uncategorized (no rules matched)')
  return 'Uncategorized'
}

/**
 * Helper to get a human-readable description of why a cohort was assigned
 * Useful for debugging and validation
 *
 * @param input - Practice information
 * @returns Description of classification reason
 */
export function getCohortReason(input: CohortClassificationInput): string {
  const cohort = classifyCohort(input)
  const { practiceName, resultingUrl, specialties, groupName } = input
  const domain = extractDomain(resultingUrl)

  switch (cohort) {
    case 'Dealers':
      return `Group name "${groupName}" contains "Dealers"`
    case 'Government':
      return `Domain "${domain}" is a .gov domain`
    case 'Education':
      return `Group name "${groupName}" includes "US Schools"`
    case 'Clinic':
      if (hasSpecialty(specialties, ['Public Health'])) {
        return `Specialty includes "Public Health"`
      }
      return `Practice name "${practiceName}" includes foundation/community/CHC keywords`
    case 'Pediatric':
      if (hasSpecialty(specialties, ['Pediatric Dentistry', 'Pediatrics'])) {
        return `Specialty includes "Pediatric Dentistry"`
      }
      return `Practice name "${practiceName}" includes pediatric keywords`
    case 'DSO':
      return 'Matched DSO exclusion list (placeholder)'
    case 'Uncategorized':
    default:
      return 'No cohort rules matched'
  }
}
