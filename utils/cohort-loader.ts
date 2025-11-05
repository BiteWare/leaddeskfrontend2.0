/**
 * Cohort Loader Utility
 *
 * Loads and provides typed access to cohort definitions from JSON.
 * Follows the same pattern as dso-check.ts for consistency.
 */

import cohortDefinitionsJson from "@/data/cohort_definitions.json";

/**
 * Cohort definition structure
 */
export interface CohortDefinition {
  name: string;
  priority: number;
  keywords?: string[];
  specialties?: string[];
  domainSuffixes?: string[];
  groupNames?: string[];
  color: string;
  excludeIfGeneralOnly?: boolean;
  strongBrands?: string[];
  requiresMultiLocation?: boolean;
}

/**
 * Typed cohort definitions array
 */
export const cohortDefinitions: CohortDefinition[] =
  cohortDefinitionsJson as CohortDefinition[];

/**
 * Get the display color for a cohort badge
 * @param cohortName - Name of the cohort
 * @returns Tailwind color class
 */
export function getCohortColor(cohortName: string): string {
  const cohort = cohortDefinitions.find(
    (c) => c.name.toLowerCase() === cohortName.toLowerCase()
  );

  if (!cohort) {
    return "slate"; // Default color for unknown cohorts
  }

  return cohort.color;
}

/**
 * Get cohort definition by name
 * @param name - Cohort name
 * @returns Cohort definition or undefined
 */
export function getCohortByName(
  name: string
): CohortDefinition | undefined {
  return cohortDefinitions.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}
