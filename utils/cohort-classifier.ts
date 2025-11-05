/**
 * Cohort Classification Utility
 *
 * Automatically classifies dental practice leads into cohorts based on
 * practice name, domain, and specialty information.
 *
 * Classification uses first-match-wins logic in priority order:
 * 1. Dealers
 * 2. Government
 * 3. Education (.edu domains, university/college keywords)
 * 4. Clinic (foundation/community/CHC keywords, dental clinic/center)
 * 5. Pediatric
 * 6. DSO (centralized exclusion list + multi-location + corporate patterns)
 * 7. Uncategorized (only when insufficient data)
 */

import { isDSO } from "./dso-check";
import { cohortDefinitions } from "./cohort-loader";

export type CohortType =
  | "Dealers"
  | "Government"
  | "Education"
  | "Clinic"
  | "Pediatric"
  | "DSO"
  | "Uncategorized";

export interface CohortClassificationInput {
  practiceName?: string | null;
  resultingUrl?: string | null;
  specialties?: string[] | null;
  groupName?: string | null;
  worksMultipleLocations?: boolean | null;
}

/**
 * Extracts domain from a URL string
 * @param url - Full URL string
 * @returns Domain name or empty string
 */
function extractDomain(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Checks if a string contains any of the given keywords (case-insensitive)
 * @param text - Text to search in
 * @param keywords - Keywords to search for
 * @returns True if any keyword is found
 */
function containsKeyword(
  text: string | null | undefined,
  keywords: string[],
): boolean {
  if (!text) return false;

  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Checks if specialty list contains any of the given specialties (case-insensitive)
 * @param specialties - Array of specialties
 * @param targetSpecialties - Specialties to search for
 * @returns True if any specialty matches
 */
function hasSpecialty(
  specialties: string[] | null | undefined,
  targetSpecialties: string[],
): boolean {
  if (!specialties || specialties.length === 0) return false;

  const lowerSpecialties = specialties.map((s) => s.toLowerCase());
  return targetSpecialties.some((target) =>
    lowerSpecialties.some((s) => s.includes(target.toLowerCase())),
  );
}

/**
 * Checks if practice is EXCLUSIVELY general dentistry (no other specialties)
 * Used to exclude pure general practices from pediatric classification
 * @param specialties - Array of specialties
 * @returns True if practice is ONLY general dentistry with no other specialties
 */
function isGeneralDentistry(specialties: string[] | null | undefined): boolean {
  if (!specialties || specialties.length === 0) return false;

  // Check if it has general dentistry/practice
  const hasGeneral = hasSpecialty(specialties, [
    "General Dentistry",
    "General Practice",
  ]);

  // Only return true if ONLY general dentistry (length 1) OR all items are general
  if (!hasGeneral) return false;

  // If there are multiple specialties and any is NOT general dentistry, return false
  const allGeneral = specialties.every((s) => {
    const lower = s.toLowerCase();
    return (
      lower.includes("general dentistry") || lower.includes("general practice")
    );
  });

  return allGeneral;
}

/**
 * Classifies a lead into a cohort based on practice information
 *
 * Uses first-match-wins logic with priority-based cohort definitions from JSON.
 * Each cohort is checked in order of priority.
 *
 * @param input - Practice information for classification
 * @returns Cohort type
 */
export function classifyCohort(input: CohortClassificationInput): CohortType {
  const {
    practiceName,
    resultingUrl,
    specialties,
    groupName,
    worksMultipleLocations,
  } = input;

  console.log("🏷️ Classifying cohort for:", {
    practiceName,
    resultingUrl,
    specialties,
    groupName,
    worksMultipleLocations,
  });

  const domain = extractDomain(resultingUrl);

  // Sort cohort definitions by priority (lower number = higher priority)
  const sortedCohorts = [...cohortDefinitions].sort(
    (a, b) => a.priority - b.priority,
  );

  // Iterate through cohorts in priority order
  for (const cohort of sortedCohorts) {
    // Skip Uncategorized - it's the final fallback
    if (cohort.name === "Uncategorized") continue;

    // Check group name matches
    if (cohort.groupNames && cohort.groupNames.length > 0) {
      if (containsKeyword(groupName, cohort.groupNames)) {
        console.log(`✅ Matched: ${cohort.name} (group name)`);
        return cohort.name as CohortType;
      }
    }

    // Check domain suffixes
    if (cohort.domainSuffixes && cohort.domainSuffixes.length > 0) {
      if (cohort.domainSuffixes.some((suffix) => domain.endsWith(suffix))) {
        console.log(`✅ Matched: ${cohort.name} (domain suffix)`);
        return cohort.name as CohortType;
      }
    }

    // Check keywords in practice name
    if (cohort.keywords && cohort.keywords.length > 0) {
      if (containsKeyword(practiceName, cohort.keywords)) {
        // Special logic for Pediatric: exclude if ONLY general dentistry
        if (cohort.excludeIfGeneralOnly && isGeneralDentistry(specialties)) {
          console.log(
            `⏭️ Skipping ${cohort.name}: practice is exclusively general dentistry`,
          );
          continue;
        }

        // Special logic for DSO: check if multi-location or strong brand
        if (cohort.name === "DSO") {
          // First check centralized DSO exclusion list
          if (isDSO(practiceName || "", domain)) {
            console.log("✅ Matched: DSO (centralized exclusion list)");
            return "DSO";
          }

          // For DSO keywords, check if it requires multi-location
          if (cohort.requiresMultiLocation) {
            const hasStrongBrand = cohort.strongBrands
              ? containsKeyword(practiceName, cohort.strongBrands)
              : false;

            if (worksMultipleLocations || hasStrongBrand) {
              console.log(
                `✅ Matched: ${cohort.name} (keywords + multi-location or strong brand)`,
              );
              return cohort.name as CohortType;
            } else {
              console.log(
                `⏭️ Skipping ${cohort.name}: has keywords but not multi-location`,
              );
              continue;
            }
          }
        }

        console.log(`✅ Matched: ${cohort.name} (keywords)`);
        return cohort.name as CohortType;
      }
    }

    // Check specialty matches
    if (cohort.specialties && cohort.specialties.length > 0) {
      if (hasSpecialty(specialties, cohort.specialties)) {
        // Special logic for Pediatric: exclude if ONLY general dentistry
        if (cohort.excludeIfGeneralOnly && isGeneralDentistry(specialties)) {
          console.log(
            `⏭️ Skipping ${cohort.name}: practice is exclusively general dentistry`,
          );
          continue;
        }

        console.log(`✅ Matched: ${cohort.name} (specialty)`);
        return cohort.name as CohortType;
      }
    }

    // Special DSO check: centralized exclusion list (if not already checked)
    if (cohort.name === "DSO") {
      if (isDSO(practiceName || "", domain)) {
        console.log("✅ Matched: DSO (centralized exclusion list)");
        return "DSO";
      }
    }
  }

  // Rule 7: Uncategorized - Only when we have insufficient data to classify
  // A practice should only be uncategorized if we lack basic information
  const hasMinimalData =
    practiceName || resultingUrl || (specialties && specialties.length > 0);

  if (!hasMinimalData) {
    console.log("⚪ Matched: Uncategorized (insufficient data to classify)");
    return "Uncategorized";
  }

  // If we have data but didn't match any cohort, it's likely a private practice
  // Keep as Uncategorized for now (PM approval needed for "Private Practice" cohort)
  console.log("⚪ Matched: Uncategorized (no cohort rules matched)");
  return "Uncategorized";
}

/**
 * Helper to get a human-readable description of why a cohort was assigned
 * Useful for debugging and validation
 *
 * @param input - Practice information
 * @returns Description of classification reason
 */
export function getCohortReason(input: CohortClassificationInput): string {
  const cohort = classifyCohort(input);
  const {
    practiceName,
    resultingUrl,
    specialties,
    groupName,
    worksMultipleLocations,
  } = input;
  const domain = extractDomain(resultingUrl);

  switch (cohort) {
    case "Dealers":
      return `Group name "${groupName}" contains "Dealers"`;
    case "Government":
      return `Domain "${domain}" is a .gov domain`;
    case "Education":
      if (domain.endsWith(".edu")) {
        return `Domain "${domain}" is a .edu domain`;
      }
      if (groupName?.toLowerCase().includes("us schools")) {
        return `Group name "${groupName}" includes "US Schools"`;
      }
      return `Practice name "${practiceName}" includes educational keywords`;
    case "Clinic":
      if (hasSpecialty(specialties, ["Public Health"])) {
        return `Specialty includes "Public Health"`;
      }
      return `Practice name "${practiceName}" includes clinic/foundation/community keywords`;
    case "Pediatric":
      if (hasSpecialty(specialties, ["Pediatric Dentistry", "Pediatrics"])) {
        return `Specialty includes "Pediatric Dentistry"`;
      }
      return `Practice name "${practiceName}" includes pediatric keywords`;
    case "DSO":
      if (worksMultipleLocations) {
        return `Multi-location practice with corporate naming patterns`;
      }
      return `Recognized DSO brand name`;
    case "Uncategorized":
    default:
      const hasData =
        practiceName || resultingUrl || (specialties && specialties.length > 0);
      if (!hasData) {
        return "Insufficient data to classify";
      }
      return "No cohort rules matched - likely private practice";
  }
}
