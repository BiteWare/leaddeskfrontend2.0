/**
 * Master Exclusion Checker
 *
 * Centralized exclusion validation system for filtering domains before job submission.
 * Uses master-exclusion.json as the single source of truth for all exclusion rules.
 */

import masterExclusionConfig from '@/data/master-exclusion.json';

export type ExclusionCategory = 'DSO' | 'EDU' | 'GOV' | 'CLINIC';

export interface MasterExclusionResult {
  isExcluded: boolean;
  category: ExclusionCategory | null;
  reason: string;
  matchedPattern?: string;
  dsoName?: string;
  detectedDomain?: string;
}

/**
 * Normalizes a domain string for comparison
 * Removes protocol, www, trailing slashes, and ports
 */
function normalizeDomain(input: string): string {
  if (!input) return '';

  let domain = input.toLowerCase().trim();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');

  // Remove www
  domain = domain.replace(/^www\./, '');

  // Remove port
  domain = domain.split(':')[0];

  // Remove path and query params
  domain = domain.split('/')[0].split('?')[0];

  return domain;
}

/**
 * Extracts the top-level domain (TLD) from a domain string
 */
function extractTLD(domain: string): string {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split('.');

  if (parts.length < 2) return '';

  // Return .tld format (e.g., ".edu", ".gov")
  return '.' + parts[parts.length - 1];
}

/**
 * Checks if a domain or practice name contains clinic-related keywords
 */
function checkClinicKeywords(practiceName: string, domain: string): { matched: boolean; keyword?: string } {
  const { clinic } = masterExclusionConfig.categories;

  if (!clinic.enabled) {
    return { matched: false };
  }

  const combinedText = `${practiceName} ${domain}`.toLowerCase();

  for (const keyword of clinic.keywords) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return { matched: true, keyword };
    }
  }

  return { matched: false };
}

/**
 * Checks if a domain or practice name contains educational institution keywords
 */
function checkEducationalKeywords(practiceName: string, domain: string): { matched: boolean; keyword?: string } {
  const { educational } = masterExclusionConfig.categories;

  if (!educational.enabled) {
    return { matched: false };
  }

  const combinedText = `${practiceName} ${domain}`.toLowerCase();

  for (const keyword of educational.keywords) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return { matched: true, keyword };
    }
  }

  return { matched: false };
}

/**
 * Checks if a domain belongs to a DSO organization
 */
function checkDSO(practiceName: string, domain: string): { matched: boolean; dsoName?: string; matchedDomain?: string } {
  const { dso } = masterExclusionConfig.categories;

  if (!dso.enabled) {
    return { matched: false };
  }

  const normalizedDomain = normalizeDomain(domain);
  const normalizedPracticeName = practiceName.toLowerCase();

  for (const org of dso.organizations) {
    // Check domain match
    if (dso.matchingRules.domainMatch) {
      for (const dsoDomain of org.domains) {
        const normalizedDSODomain = normalizeDomain(dsoDomain);
        if (normalizedDomain.includes(normalizedDSODomain)) {
          return { matched: true, dsoName: org.name, matchedDomain: dsoDomain };
        }
      }
    }

    // Check practice name match
    if (dso.matchingRules.nameMatch) {
      const normalizedOrgName = org.name.toLowerCase();
      if (normalizedPracticeName.includes(normalizedOrgName)) {
        return { matched: true, dsoName: org.name };
      }
    }
  }

  return { matched: false };
}

/**
 * Checks if a domain has an excluded TLD (.edu, .gov, .mil)
 */
function checkTLD(domain: string): { matched: boolean; tld?: string; category?: ExclusionCategory } {
  const tld = extractTLD(domain);

  if (!tld) {
    return { matched: false };
  }

  // Check educational TLDs
  const { educational } = masterExclusionConfig.categories;
  if (educational.enabled && educational.tlds.includes(tld)) {
    return { matched: true, tld, category: 'EDU' };
  }

  // Check government TLDs
  const { government } = masterExclusionConfig.categories;
  if (government.enabled && government.tlds.includes(tld)) {
    return { matched: true, tld, category: 'GOV' };
  }

  return { matched: false };
}

/**
 * Main exclusion checker - validates practice against all master exclusion rules
 *
 * Priority order:
 * 1. TLD-based exclusions (.edu, .gov, .mil) - highest priority
 * 2. DSO exclusions
 * 3. Educational keyword exclusions
 * 4. Clinic keyword exclusions
 *
 * @param practiceName - The name of the dental practice
 * @param domain - The domain/URL to check (can be full URL or just domain)
 * @returns MasterExclusionResult with exclusion status and details
 */
export function checkMasterExclusion(
  practiceName: string,
  domain: string
): MasterExclusionResult {

  if (!practiceName && !domain) {
    return {
      isExcluded: false,
      category: null,
      reason: 'No data provided for exclusion check'
    };
  }

  const normalizedDomain = normalizeDomain(domain);
  const normalizedPracticeName = practiceName || '';

  // PRIORITY 1: Check TLD-based exclusions (.edu, .gov, .mil)
  const tldCheck = checkTLD(normalizedDomain);
  if (tldCheck.matched) {
    if (tldCheck.category === 'EDU') {
      return {
        isExcluded: true,
        category: 'EDU',
        reason: `Educational institution (.edu domain)`,
        matchedPattern: tldCheck.tld,
        detectedDomain: normalizedDomain
      };
    }

    if (tldCheck.category === 'GOV') {
      return {
        isExcluded: true,
        category: 'GOV',
        reason: `Government entity (${tldCheck.tld} domain)`,
        matchedPattern: tldCheck.tld,
        detectedDomain: normalizedDomain
      };
    }
  }

  // PRIORITY 2: Check DSO exclusions
  const dsoCheck = checkDSO(normalizedPracticeName, normalizedDomain);
  if (dsoCheck.matched) {
    return {
      isExcluded: true,
      category: 'DSO',
      reason: `DSO organization: ${dsoCheck.dsoName}`,
      matchedPattern: dsoCheck.matchedDomain,
      dsoName: dsoCheck.dsoName,
      detectedDomain: normalizedDomain
    };
  }

  // PRIORITY 3: Check educational keywords (catches dental schools without .edu domains)
  const eduKeywordCheck = checkEducationalKeywords(normalizedPracticeName, normalizedDomain);
  if (eduKeywordCheck.matched) {
    return {
      isExcluded: true,
      category: 'EDU',
      reason: `Educational institution (matched keyword: "${eduKeywordCheck.keyword}")`,
      matchedPattern: eduKeywordCheck.keyword,
      detectedDomain: normalizedDomain
    };
  }

  // PRIORITY 4: Check clinic keywords
  const clinicCheck = checkClinicKeywords(normalizedPracticeName, normalizedDomain);
  if (clinicCheck.matched) {
    return {
      isExcluded: true,
      category: 'CLINIC',
      reason: `Community clinic or health center (matched keyword: "${clinicCheck.keyword}")`,
      matchedPattern: clinicCheck.keyword,
      detectedDomain: normalizedDomain
    };
  }

  // Not excluded - valid practice
  return {
    isExcluded: false,
    category: null,
    reason: 'Practice passed all exclusion checks',
    detectedDomain: normalizedDomain
  };
}

/**
 * Quick check to see if a domain has any exclusion patterns
 * Used for pre-validation before full check
 */
export function hasExclusionPattern(domain: string): boolean {
  const normalizedDomain = normalizeDomain(domain);
  const tld = extractTLD(normalizedDomain);

  // Quick TLD check
  const { educational, government } = masterExclusionConfig.categories;
  const excludedTlds = [
    ...(educational.enabled ? educational.tlds : []),
    ...(government.enabled ? government.tlds : [])
  ];

  return excludedTlds.includes(tld);
}

/**
 * Get the master exclusion configuration
 * Useful for debugging and admin interfaces
 */
export function getMasterExclusionConfig() {
  return masterExclusionConfig;
}

/**
 * Get count of DSO organizations in the exclusion list
 */
export function getDSOCount(): number {
  return masterExclusionConfig.categories.dso.organizations.length;
}

/**
 * Get count of educational keywords
 */
export function getEducationalKeywordCount(): number {
  return masterExclusionConfig.categories.educational.keywords.length;
}

/**
 * Get count of clinic keywords
 */
export function getClinicKeywordCount(): number {
  return masterExclusionConfig.categories.clinic.keywords.length;
}
