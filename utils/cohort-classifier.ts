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
 * Uses first-match-wins logic:
 * - Dealers: Group name contains "Dealers"
 * - Government: .gov domain
 * - Education: .edu domain OR university/college keywords OR group name "US Schools"
 * - Clinic: Name includes foundation/community/CHC/clinic/center keywords OR specialty = "Public Health"
 * - Pediatric: Name includes pediatric keywords OR specialty = "Pediatric Dentistry" (excluding general dentistry)
 * - DSO: Multi-location practices with corporate patterns (dental group/partners/associates)
 * - Uncategorized: Only when insufficient data to classify
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

  // Rule 1: Dealers - group name contains "Dealers"
  if (containsKeyword(groupName, ["Dealers"])) {
    console.log("✅ Matched: Dealers (group name)");
    return "Dealers";
  }

  // Rule 2: Government - .gov domain
  const domain = extractDomain(resultingUrl);
  if (domain.endsWith(".gov")) {
    console.log("✅ Matched: Government (.gov domain)");
    return "Government";
  }

  // Rule 3: Education - .edu domain OR university/college keywords OR group name "US Schools"
  const educationKeywords = [
    "university",
    "college",
    "school of dentistry",
    "dental school",
  ];
  if (
    domain.endsWith(".edu") ||
    containsKeyword(practiceName, educationKeywords) ||
    containsKeyword(groupName, ["US Schools"])
  ) {
    console.log(
      "✅ Matched: Education (.edu domain, educational keywords, or US Schools)",
    );
    return "Education";
  }

  // Rule 4: Clinic - name includes foundation/community/CHC/clinic/center OR specialty = "Public Health"
  const clinicKeywords = [
    "foundation",
    "community",
    "chc",
    "dental clinic",
    "dental center",
    "oral health center",
    "health center",
  ];
  if (
    containsKeyword(practiceName, clinicKeywords) ||
    hasSpecialty(specialties, ["Public Health"])
  ) {
    console.log(
      "✅ Matched: Clinic (foundation/community/CHC/clinic/center or Public Health)",
    );
    return "Clinic";
  }

  // Rule 5: Pediatric - name includes pediatric keywords OR specialty = "Pediatric Dentistry"
  // BUT exclude if it's EXCLUSIVELY general dentistry practice
  const pediatricKeywords = ["kids", "pediatric", "children", "sugarbug"];
  const hasPediatricName = containsKeyword(practiceName, pediatricKeywords);
  const hasPediatricSpecialty = hasSpecialty(specialties, [
    "Pediatric Dentistry",
    "Pediatrics",
  ]);
  const isExclusivelyGeneral = isGeneralDentistry(specialties);

  console.log("🔍 Pediatric check:", {
    hasPediatricName,
    hasPediatricSpecialty,
    isExclusivelyGeneral,
    specialties,
  });

  if ((hasPediatricName || hasPediatricSpecialty) && !isExclusivelyGeneral) {
    console.log(
      "✅ Matched: Pediatric (pediatric keywords or specialty, not exclusively general)",
    );
    return "Pediatric";
  }

  // Rule 6: DSO - Centralized exclusion list + Multi-location practices with corporate patterns
  // First, check against the centralized DSO exclusion list
  if (isDSO(practiceName || "", domain)) {
    console.log("✅ Matched: DSO (centralized exclusion list)");
    return "DSO";
  }

  // Fallback: Check for corporate patterns + multi-location (existing logic)
  const dsoKeywords = [
    "dental group",
    "dental partners",
    "dental associates",
    "family dental",
    "smile brands",
    "aspen dental",
    "bright now",
    "dental care alliance",
    "heartland dental",
    "pacific dental",
    "affordable care",
    "smile doctors",
    "dental care group",
    "dental organization",
  ];

  // DSO detection: corporate keywords + multi-location OR just strong DSO brand names
  const hasDSOKeywords = containsKeyword(practiceName, dsoKeywords);
  const isMultiLocation = worksMultipleLocations === true;

  // Strong DSO brand names that indicate DSO even without multi-location confirmation
  const strongDSOBrands = [
    "aspen dental",
    "bright now",
    "heartland dental",
    "pacific dental",
    "smile brands",
  ];
  const hasStrongDSOBrand = containsKeyword(practiceName, strongDSOBrands);

  if (hasDSOKeywords && (isMultiLocation || hasStrongDSOBrand)) {
    console.log(
      "✅ Matched: DSO (corporate keywords + multi-location or strong brand)",
    );
    return "DSO";
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
