/**
 * Centralized transformer for scraper output to LeadData format
 * This ensures consistent transformation across the entire application
 */

import type { LeadData } from "@/components/lead-view";
import {
  parseScraperWorkerResults,
  extractScraperMetadata,
} from "./scraper-parser";
import { classifyCohort } from "./cohort-classifier";

export interface JobInputData {
  input_customer_name?: string | null;
  input_street_address?: string | null;
  input_city?: string | null;
  input_state?: string | null;
}

/**
 * Normalizes a value by converting empty strings and whitespace-only strings to undefined
 * This ensures empty fields display as "Not available" instead of blank in the UI
 */
function normalizeValue(value: any): any {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value || undefined;
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
  jobInputData?: JobInputData,
): LeadData {
  // Parse the scraper output from the database
  const scraperOutput = parseScraperWorkerResults(scraperWorkerResultsJson);

  console.log("🔧 Transformer - Parsed scraper output:", scraperOutput);
  console.log("🔧 Transformer - Job input data:", jobInputData);
  console.log("🔧 Available fields:", Object.keys(scraperOutput || {}));
  console.log("🔧 Raw locations from scraper:", scraperOutput?.locations);

  // Classify cohort based on practice information
  const cohort = scraperOutput
    ? classifyCohort({
        practiceName: scraperOutput.practice_name,
        resultingUrl: scraperOutput.resulting_url,
        specialties: scraperOutput.practice_specialties,
        groupName: scraperOutput.group_name,
        worksMultipleLocations: scraperOutput.works_multiple_locations,
      })
    : "Uncategorized";

  console.log("🏷️ Transformer - Assigned cohort:", cohort);

  // Build fallback address from job input
  const fallbackAddress = jobInputData
    ? [
        jobInputData.input_street_address,
        jobInputData.input_city,
        jobInputData.input_state,
      ]
        .filter(Boolean)
        .join(", ")
    : "Address not available";

  if (!scraperOutput) {
    return {
      practiceName: jobInputData?.input_customer_name || "Unknown Practice",
      practiceAddress: fallbackAddress,
      practiceSpecialty: "General Practice",
      numberOfDentists: 0,
      numberOfHygienists: 0,
      specialties: [],
      staff: [],
      locations: [],
      resultingUrl: undefined,
      personInCharge: undefined,
      worksMultipleLocations: undefined,
      scrapeNotes: undefined,
      rawJson: scraperWorkerResultsJson,
    };
  }

  // Count staff by role
  const dentists =
    scraperOutput.staff_list?.filter(
      (s: any) =>
        s.role?.toLowerCase().includes("dentist") ||
        s.role?.toLowerCase().includes("dds") ||
        s.role?.toLowerCase().includes("dmd"),
    ) || [];

  const hygienists =
    scraperOutput.staff_list?.filter((s: any) =>
      s.role?.toLowerCase().includes("hygienist"),
    ) || [];

  // Enhanced location parsing function
  const parseLocationName = (
    loc: any,
    index: number,
    practiceName: string,
  ): string => {
    // If we have a meaningful name, use it
    if (
      loc.name &&
      typeof loc.name === "string" &&
      loc.name.trim() &&
      !loc.name.toLowerCase().includes("location")
    ) {
      return loc.name.trim();
    }

    // Try to extract location info from address
    if (loc.address && typeof loc.address === "string" && loc.address.trim()) {
      const address = loc.address.trim();
      // Look for common location indicators in address
      const locationIndicators = [
        "office",
        "clinic",
        "center",
        "building",
        "suite",
        "floor",
      ];
      const addressLower = address.toLowerCase();

      for (const indicator of locationIndicators) {
        if (addressLower.includes(indicator)) {
          // Extract text around the indicator
          const parts = address.split(/\s+/);
          const indicatorIndex = parts.findIndex((part: string) =>
            part.toLowerCase().includes(indicator),
          );
          if (indicatorIndex >= 0) {
            // Take 2-3 words around the indicator
            const start = Math.max(0, indicatorIndex - 1);
            const end = Math.min(parts.length, indicatorIndex + 3);
            return parts.slice(start, end).join(" ");
          }
        }
      }

      // If no indicators found, use first part of address
      const firstPart = address.split(",")[0].trim();
      if (firstPart && firstPart.length > 3) {
        return firstPart;
      }
    }

    // Try to use practice name with location suffix
    if (
      practiceName &&
      typeof practiceName === "string" &&
      practiceName.trim()
    ) {
      const baseName = practiceName.trim();
      if (index === 0) {
        return `${baseName} - Main Office`;
      } else {
        return `${baseName} - Location ${index + 1}`;
      }
    }

    // Final fallback
    return `Location ${index + 1}`;
  };

  // Helper to convert address objects to strings
  const safeString = (value: any): string => {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      // Handle address objects that might have street, city, state, zip properties
      const parts = [];
      if (value.street) parts.push(value.street);
      if (value.address) parts.push(value.address);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.zip || value.zipCode) parts.push(value.zip || value.zipCode);
      if (parts.length > 0) return parts.join(", ");
    }
    return String(value);
  };

  // Transform locations with enhanced parsing
  let locations =
    scraperOutput.locations?.map((loc: any, index: number) => {
      return {
        id: (index + 1).toString(),
        name: safeString(
          parseLocationName(loc, index, scraperOutput.practice_name),
        ),
        address: safeString(loc.address || ""),
        phone: safeString(normalizeValue(loc.phone) || ""),
        email: safeString(normalizeValue(loc.email) || ""),
        manager: safeString(loc.manager || "Unknown"),
        staffCount:
          typeof loc.staff_at_location?.length === "number"
            ? loc.staff_at_location.length
            : 0,
        state: safeString(loc.state || "Unknown"),
      };
    }) || [];

  console.log("🔧 Transformed locations:", locations);

  // If no locations from scraper but we have job input data, create a location entry
  if (locations.length === 0 && jobInputData) {
    const inputAddress = [
      jobInputData.input_street_address,
      jobInputData.input_city,
      jobInputData.input_state,
    ]
      .filter(Boolean)
      .join(", ");

    if (inputAddress) {
      // Create a more meaningful location name
      const practiceName =
        jobInputData.input_customer_name ||
        scraperOutput.practice_name ||
        "Practice";
      const locationName =
        practiceName.includes("Office") || practiceName.includes("Clinic")
          ? practiceName
          : `${practiceName} - Main Office`;

      locations = [
        {
          id: "1",
          name: locationName,
          address: inputAddress,
          phone: normalizeValue(scraperOutput.phone) || "",
          email: normalizeValue(scraperOutput.email) || "",
          manager: "Unknown",
          staffCount: 0,
          state: jobInputData.input_state || "Unknown",
        },
      ];
    }
  }

  // Transform staff with deduplication
  const staffMap = new Map<string, any>();

  // Add person in charge first (only if name is not empty)
  if (
    scraperOutput.person_in_charge?.name &&
    scraperOutput.person_in_charge.name.trim() !== ""
  ) {
    const key = scraperOutput.person_in_charge.name.trim().toLowerCase();
    staffMap.set(key, {
      name: scraperOutput.person_in_charge.name,
      role: scraperOutput.person_in_charge.role,
      credentials: scraperOutput.person_in_charge.credentials,
      location: "Main Office",
    });
  }

  // Add all staff from staff_list (skip if already exists)
  if (scraperOutput.staff_list) {
    scraperOutput.staff_list.forEach((member: any) => {
      if (member.name && member.name.trim() !== "") {
        const key = member.name.trim().toLowerCase();
        // Only add if not already in map
        if (!staffMap.has(key)) {
          staffMap.set(key, {
            name: member.name,
            role: member.role,
            credentials: member.credentials,
            location: undefined,
          });
        }
      }
    });
  }

  // Add staff from locations (skip if already exists)
  if (scraperOutput.locations) {
    scraperOutput.locations.forEach((location: any) => {
      if (location.staff_at_location) {
        location.staff_at_location.forEach((member: any) => {
          if (member.name && member.name.trim() !== "") {
            const key = member.name.trim().toLowerCase();
            // Only add if not already in map, or update location if already exists
            if (!staffMap.has(key)) {
              staffMap.set(key, {
                name: member.name,
                role: member.role,
                credentials: member.credentials,
                location: location.name,
              });
            } else {
              // Update location if staff already exists but didn't have a location
              const existing = staffMap.get(key);
              if (!existing.location) {
                existing.location = location.name;
              }
            }
          }
        });
      }
    });
  }

  // Convert map to array and ensure all properties are strings
  const staff = Array.from(staffMap.values()).map((member) => ({
    name: String(member.name || ""),
    role: String(member.role || ""),
    location: member.location ? String(member.location) : undefined,
    credentials: member.credentials ? String(member.credentials) : undefined,
  }));

  // Build full address from job input as fallback
  const fallbackFullAddress = jobInputData
    ? [
        jobInputData.input_street_address,
        jobInputData.input_city,
        jobInputData.input_state,
      ]
        .filter(Boolean)
        .join(", ")
    : "Address not available";

  // Determine practice address with proper string conversion
  const rawLocationAddress =
    locations[0]?.address || scraperOutput.locations?.[0]?.address;
  console.log(
    "🔧 Raw location address (type):",
    typeof rawLocationAddress,
    rawLocationAddress,
  );
  console.log("🔧 First transformed location address:", locations[0]?.address);
  console.log("🔧 Fallback address:", fallbackFullAddress);

  const practiceAddress = rawLocationAddress
    ? safeString(rawLocationAddress)
    : fallbackFullAddress;

  console.log("🔧 Final practice address:", practiceAddress);

  // Determine practice phone with same pattern as address - prioritize first location
  const practicePhone = normalizeValue(
    locations[0]?.phone || scraperOutput.phone,
  );
  console.log("🔧 Practice phone from locations[0]:", locations[0]?.phone);
  console.log("🔧 Practice phone from scraperOutput:", scraperOutput.phone);
  console.log("🔧 Final practice phone:", practicePhone);

  // Construct original input string from job input data
  const originalInput = jobInputData
    ? [
        jobInputData.input_customer_name,
        jobInputData.input_street_address,
        jobInputData.input_city,
        jobInputData.input_state,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  console.log("🔧 Constructed original input:", originalInput);

  return {
    practiceName: String(
      scraperOutput.practice_name ||
        jobInputData?.input_customer_name ||
        "Unknown Practice",
    ),
    practiceAddress: practiceAddress,
    practiceWebsite:
      scraperOutput.resulting_url || scraperOutput.website || undefined,
    practicePhone: practicePhone,
    practiceEmail: normalizeValue(scraperOutput.email),
    practiceSpecialty: String(
      scraperOutput.practice_specialties?.join(", ") || "General Practice",
    ),
    numberOfDentists: dentists.length,
    numberOfHygienists: hygienists.length,
    specialties: scraperOutput.practice_specialties || [],
    staff: staff,
    locations: locations,
    // Add scraper metadata
    resultingUrl: scraperOutput.resulting_url,
    personInCharge: scraperOutput.person_in_charge,
    worksMultipleLocations: scraperOutput.works_multiple_locations,
    scrapeNotes: scraperOutput.scrape_notes,
    // Add cohort classification
    cohort: cohort,
    // Add exclusion flag - automatically exclude DSO practices
    excluded: cohort === "DSO",
    // Add original user input
    originalInput: originalInput,
    // Add raw JSON data
    rawJson: scraperWorkerResultsJson,
  };
}
