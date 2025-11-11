/**
 * Domain Detector Utility
 *
 * Detects DSO, EDU, GOV, and CLINIC domains from user input before backend submission.
 * Prevents unnecessary API calls for excluded practice types.
 *
 * Now uses master-exclusion.json as the single source of truth for all exclusion rules.
 */

import {
  checkMasterExclusion,
  hasExclusionPattern as hasMasterExclusionPattern,
  type ExclusionCategory,
} from "./master-exclusion-checker";

export type ExclusionType = "DSO" | "EDU" | "GOV" | "CLINIC" | null;

export interface DomainDetectionResult {
  isExcluded: boolean;
  exclusionType: ExclusionType;
  dsoName?: string;
  detectedDomain?: string;
  reason?: string;
  matchedPattern?: string;
}

/**
 * Extracts domain from various input formats
 * Handles: URLs, domains, practice names with domains
 *
 * @param input - User input (URL, domain, or practice name)
 * @returns Extracted domain or null
 *
 * @example
 * extractDomain("https://heartlanddental.com/boston") // "heartlanddental.com"
 * extractDomain("heartlanddental.com") // "heartlanddental.com"
 * extractDomain("Heartland Dental of Boston") // null (no domain found)
 */
export function extractDomain(input: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  try {
    // Try parsing as URL first
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      return url.hostname;
    }

    // Check if input looks like a domain (contains dots, no spaces)
    if (trimmed.includes(".") && !trimmed.includes(" ")) {
      // Remove protocol if present
      const withoutProtocol = trimmed.replace(/^(https?:\/\/)/, "");

      // Extract just the domain (remove path, query, hash)
      const domainPart = withoutProtocol
        .split("/")[0]
        .split("?")[0]
        .split("#")[0];

      // Basic domain validation (has at least one dot and valid characters)
      if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainPart)) {
        return domainPart;
      }
    }

    // Try to extract domain from text (e.g., "visit us at heartland.com")
    const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i;
    const match = trimmed.match(domainPattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  } catch (error) {
    // URL parsing failed, continue to return null
    console.log("Domain extraction failed:", error);
  }

  return null;
}

/**
 * Checks if a domain is an educational institution (.edu TLD)
 *
 * @deprecated Use checkMasterExclusion() instead for comprehensive exclusion checking
 * @param domain - Domain to check
 * @returns True if domain ends with .edu
 */
export function isEDUDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") {
    return false;
  }
  return domain.trim().toLowerCase().endsWith(".edu");
}

/**
 * Detects if user input should be excluded (DSO, EDU, GOV, or CLINIC)
 * Run this BEFORE submitting to backend to prevent unnecessary API calls
 *
 * Uses master-exclusion.json for comprehensive exclusion checking including:
 * - DSO organizations
 * - Educational institutions (.edu domains + keywords)
 * - Government entities (.gov, .mil domains)
 * - Community clinics and health centers
 *
 * @param practiceName - Practice name from user input
 * @param input - Full user input (may contain domain/URL)
 * @returns Detection result with exclusion type and details
 *
 * @example
 * // DSO detection
 * detectExclusion("Heartland Dental", "heartlanddental.com")
 * // { isExcluded: true, exclusionType: "DSO", dsoName: "Heartland Dental", ... }
 *
 * // EDU detection (TLD)
 * detectExclusion("Harvard Dental", "harvard.edu")
 * // { isExcluded: true, exclusionType: "EDU", ... }
 *
 * // EDU detection (keyword)
 * detectExclusion("UCLA School of Dentistry", "ucla.com")
 * // { isExcluded: true, exclusionType: "EDU", matchedPattern: "school of dentistry", ... }
 *
 * // GOV detection
 * detectExclusion("VA Dental Clinic", "va.gov")
 * // { isExcluded: true, exclusionType: "GOV", ... }
 *
 * // CLINIC detection
 * detectExclusion("Community Health Center", "chcdental.org")
 * // { isExcluded: true, exclusionType: "CLINIC", matchedPattern: "community health", ... }
 *
 * // Normal practice
 * detectExclusion("Smith Family Dental", "smithdental.com")
 * // { isExcluded: false, exclusionType: null }
 */
export function detectExclusion(
  practiceName: string,
  input: string,
): DomainDetectionResult {
  const domain = extractDomain(input) || input;

  // Use master exclusion checker for comprehensive validation
  const result = checkMasterExclusion(practiceName, domain);

  return {
    isExcluded: result.isExcluded,
    exclusionType: result.category,
    dsoName: result.dsoName,
    detectedDomain: result.detectedDomain,
    reason: result.reason,
    matchedPattern: result.matchedPattern,
  };
}

/**
 * Quick check if input contains obvious exclusion patterns
 * Useful for early validation without full parsing
 *
 * Now uses master exclusion system for consistent pattern matching
 *
 * @param input - User input to check
 * @returns True if input appears to be excluded
 */
export function hasExclusionPattern(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  // Use master exclusion checker's quick pattern check
  return hasMasterExclusionPattern(input);
}
