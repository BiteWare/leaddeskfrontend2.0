/**
 * Utilities for parsing and transforming scraper_worker_results_json data
 * from the OpenAI Responses API format
 */

export interface ScraperWorkerOutput {
  practice_name: string;
  resulting_url: string;
  person_in_charge: {
    name: string;
    role: string;
    credentials?: string;
  };
  staff_list: Array<{
    name: string;
    role: string;
    credentials?: string;
  }>;
  works_multiple_locations: boolean;
  scrape_notes?: string;
  locations?: Array<{
    name: string;
    address: string;
    phone?: string;
    email?: string;
    state?: string;
    manager?: string;
    staff_at_location?: Array<{
      name: string;
      role: string;
      credentials?: string;
    }>;
  }>;
  practice_specialties?: string[];
  phone?: string;
  email?: string;
  website?: string;
  cohort?: string;
  group_name?: string;
}

/**
 * Parses the scraper_worker_results_json from the database.
 * OpenAI Responses API structure varies depending on how n8n stores it.
 * This function tries multiple parsing strategies.
 *
 * @param scraperWorkerResultsJson - The raw JSON from the database
 * @returns Parsed scraper output or null if parsing fails
 */
export function parseScraperWorkerResults(
  scraperWorkerResultsJson: any,
): ScraperWorkerOutput | null {
  try {
    if (!scraperWorkerResultsJson) {
      console.warn("⚠️ No scraperWorkerResultsJson provided");
      return null;
    }

    console.log("🔍 Attempting to parse scraper_worker_results_jsonb...");
    console.log("📦 Type:", typeof scraperWorkerResultsJson);
    console.log("📦 Keys:", Object.keys(scraperWorkerResultsJson));

    // Strategy 1: Already parsed - direct object with practice_name
    if (scraperWorkerResultsJson.practice_name) {
      console.log("✅ Strategy 1: Direct object - already parsed");
      return scraperWorkerResultsJson as ScraperWorkerOutput;
    }

    // Strategy 2: Array of output items - find the assistant message
    if (Array.isArray(scraperWorkerResultsJson?.output)) {
      console.log(
        "✅ Strategy 2: Output array format - searching for assistant message",
      );
      // Find the message object with type "message" and role "assistant"
      const messageItem = scraperWorkerResultsJson.output.find(
        (item: any) => item.type === "message" && item.role === "assistant",
      );

      if (messageItem?.content?.[0]?.text) {
        console.log("✅ Found assistant message in output array");
        const textContent = messageItem.content[0].text;
        return JSON.parse(textContent) as ScraperWorkerOutput;
      }

      // Fallback: try first item with content (old Claude format)
      const firstContentItem = scraperWorkerResultsJson.output.find(
        (item: any) => item?.content?.[0]?.text,
      );
      if (firstContentItem?.content?.[0]?.text) {
        console.log("✅ Found content in first available output item");
        const textContent = firstContentItem.content[0].text;
        return JSON.parse(textContent) as ScraperWorkerOutput;
      }
    }

    // Strategy 3: Nested in output[0].content[0].text (Old Claude API format, keeping for compatibility)
    if (scraperWorkerResultsJson?.output?.[0]?.content?.[0]?.text) {
      console.log(
        "✅ Strategy 3: Legacy Claude API format - parsing from output[0].content[0].text",
      );
      const textContent = scraperWorkerResultsJson.output[0].content[0].text;
      return JSON.parse(textContent) as ScraperWorkerOutput;
    }

    // Strategy 4: OpenAI response object with output field (string)
    if (typeof scraperWorkerResultsJson.output === "string") {
      console.log(
        "✅ Strategy 4: OpenAI string output - parsing from output field",
      );
      return JSON.parse(scraperWorkerResultsJson.output) as ScraperWorkerOutput;
    }

    // Strategy 5: OpenAI response object with output field (object)
    if (
      scraperWorkerResultsJson.output &&
      typeof scraperWorkerResultsJson.output === "object" &&
      !Array.isArray(scraperWorkerResultsJson.output)
    ) {
      console.log(
        "✅ Strategy 5: OpenAI object output - using output field directly",
      );
      return scraperWorkerResultsJson.output as ScraperWorkerOutput;
    }

    // Strategy 6: Check if it's a stringified JSON
    if (typeof scraperWorkerResultsJson === "string") {
      console.log("✅ Strategy 6: String - parsing as JSON");
      return JSON.parse(scraperWorkerResultsJson) as ScraperWorkerOutput;
    }

    console.error("❌ No valid parsing strategy found");
    console.log(
      "📦 Full object:",
      JSON.stringify(scraperWorkerResultsJson, null, 2),
    );
    return null;
  } catch (error) {
    console.error("❌ Failed to parse scraper_worker_results_json:", error);
    console.log(
      "📦 Problematic data:",
      JSON.stringify(scraperWorkerResultsJson, null, 2),
    );
    return null;
  }
}

/**
 * Converts raw scraper output to enriched_json format for backwards compatibility
 * This allows us to use scraper_worker_results_json as a fallback when enriched_json is not available
 *
 * @param scraperOutput - Parsed scraper worker output
 * @returns Enriched JSON format compatible with existing transform functions
 */
export function scraperOutputToEnrichedJson(
  scraperOutput: ScraperWorkerOutput,
): any {
  return {
    practice_name: scraperOutput.practice_name,
    website: scraperOutput.resulting_url || scraperOutput.website,
    phone: scraperOutput.phone,
    email: scraperOutput.email,
    person_in_charge: scraperOutput.person_in_charge,
    works_multiple_locations: scraperOutput.works_multiple_locations,
    scrape_notes: scraperOutput.scrape_notes,
    practice_specialties: scraperOutput.practice_specialties || [],
    locations: scraperOutput.locations || [],
    // Map staff_list to locations structure if locations not provided
    staff:
      scraperOutput.staff_list?.map((member) => ({
        name: member.name,
        role: member.role,
        credentials: member.credentials,
      })) || [],
  };
}

/**
 * Extracts metadata from scraper results that isn't in enriched_json
 *
 * @param scraperOutput - Parsed scraper worker output
 * @returns Object with scraper-specific metadata
 */
export function extractScraperMetadata(
  scraperOutput: ScraperWorkerOutput | null,
) {
  if (!scraperOutput) {
    return {
      resultingUrl: undefined,
      personInCharge: undefined,
      worksMultipleLocations: undefined,
      scrapeNotes: undefined,
    };
  }

  return {
    resultingUrl: scraperOutput.resulting_url,
    personInCharge: scraperOutput.person_in_charge,
    worksMultipleLocations: scraperOutput.works_multiple_locations,
    scrapeNotes: scraperOutput.scrape_notes,
  };
}
