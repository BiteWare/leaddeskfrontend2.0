/**
 * Domain Detector Utility
 *
 * Detects DSO and EDU domains from user input before backend submission.
 * Prevents unnecessary API calls for excluded practice types.
 */

import { isDSO, getDSOName } from "./dso-check";

export type ExclusionType = "DSO" | "EDU" | null;

export interface DomainDetectionResult {
  isExcluded: boolean;
  exclusionType: ExclusionType;
  dsoName?: string;
  detectedDomain?: string;
  reason?: string;
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
      const domainPart = withoutProtocol.split("/")[0].split("?")[0].split("#")[0];

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
 * Detects if user input should be excluded (DSO or EDU)
 * Run this BEFORE submitting to backend to prevent unnecessary API calls
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
 * // EDU detection
 * detectExclusion("Harvard Dental", "harvard.edu")
 * // { isExcluded: true, exclusionType: "EDU", ... }
 *
 * // Normal practice
 * detectExclusion("Smith Family Dental", "smithdental.com")
 * // { isExcluded: false, exclusionType: null }
 */
export function detectExclusion(
  practiceName: string,
  input: string
): DomainDetectionResult {
  const domain = extractDomain(input);

  // Check for EDU domain first (simple TLD check)
  if (domain && isEDUDomain(domain)) {
    return {
      isExcluded: true,
      exclusionType: "EDU",
      detectedDomain: domain,
      reason: "Educational institution domain detected (.edu)",
    };
  }

  // Check for DSO using existing DSO detection logic
  if (isDSO(practiceName, domain || "")) {
    const dsoName = getDSOName(practiceName, domain || "");
    return {
      isExcluded: true,
      exclusionType: "DSO",
      dsoName,
      detectedDomain: domain || undefined,
      reason: dsoName
        ? `Practice identified as ${dsoName}`
        : "DSO organization detected",
    };
  }

  // Not excluded
  return {
    isExcluded: false,
    exclusionType: null,
    detectedDomain: domain || undefined,
  };
}

/**
 * Quick check if input contains obvious exclusion patterns
 * Useful for early validation without full parsing
 *
 * @param input - User input to check
 * @returns True if input appears to be excluded
 */
export function hasExclusionPattern(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const lower = input.toLowerCase();

  // Check for .edu TLD
  if (lower.includes(".edu")) {
    return true;
  }

  // Check for common DSO keywords in domain
  const dsoKeywords = [
    "heartland",
    "aspen",
    "pdshealth",
    "smilebrands",
    "mb2dental",
  ];

  return dsoKeywords.some((keyword) => lower.includes(keyword));
}
