/**
 * DSO (Dental Service Organization) Detection Utility
 *
 * Checks practice name and domain against a centralized DSO exclusion list
 * to identify practices affiliated with major DSO organizations.
 */

import dsoList from "@/data/dso_exclusions.json";

export interface DSOExclusion {
  name: string;
  domains: string[];
}

/**
 * Checks if a practice is part of a major DSO organization
 *
 * @param practiceName - The name of the dental practice
 * @param domain - The domain/URL of the practice website
 * @returns True if the practice is identified as a DSO, false otherwise
 *
 * @example
 * isDSO("Heartland Dental of Boston", "heartlanddental.com") // true
 * isDSO("Smith Family Dentistry", "smithfamilydental.com") // false
 */
export function isDSO(practiceName: string = "", domain: string = ""): boolean {
  const name = practiceName.toLowerCase().trim();
  const host = domain.toLowerCase().trim();

  // Return false if both inputs are empty
  if (!name && !host) {
    return false;
  }

  return (dsoList as DSOExclusion[]).some((dso) => {
    // Check if practice name contains DSO brand name
    const nameMatch = name.includes(dso.name.toLowerCase());

    // Check if domain contains any of the DSO's known domains
    const domainMatch = dso.domains.some((d) => host.includes(d.toLowerCase()));

    return nameMatch || domainMatch;
  });
}

/**
 * Gets the DSO name if the practice is identified as a DSO
 *
 * @param practiceName - The name of the dental practice
 * @param domain - The domain/URL of the practice website
 * @returns The DSO name if found, undefined otherwise
 *
 * @example
 * getDSOName("Heartland Dental of Boston", "heartlanddental.com") // "Heartland Dental"
 * getDSOName("Smith Family Dentistry", "smithfamilydental.com") // undefined
 */
export function getDSOName(
  practiceName: string = "",
  domain: string = "",
): string | undefined {
  const name = practiceName.toLowerCase().trim();
  const host = domain.toLowerCase().trim();

  if (!name && !host) {
    return undefined;
  }

  const matchedDSO = (dsoList as DSOExclusion[]).find((dso) => {
    const nameMatch = name.includes(dso.name.toLowerCase());
    const domainMatch = dso.domains.some((d) => host.includes(d.toLowerCase()));
    return nameMatch || domainMatch;
  });

  return matchedDSO?.name;
}
