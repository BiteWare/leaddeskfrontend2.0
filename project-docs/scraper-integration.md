# Scraper Worker Results Integration

## Overview

This document describes how `scraper_worker_results_jsonb` data from the OpenAI Responses API is parsed, transformed, and displayed in the frontend.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Database (enrichment_jobs table)                      │
│                    scraper_worker_results_jsonb column                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │      useJobData Hook                │
                    │   (hooks/useJobData.ts)             │
                    │                                     │
                    │ • Fetches job from database         │
                    │ • Returns full EnrichmentJob record │
                    │ • Provides loading/error states     │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │  parseScraperWorkerResults()        │
                    │  (utils/scraper-parser.ts)          │
                    │                                     │
                    │ Tries 5 parsing strategies:         │
                    │ 1. Direct object (already parsed)   │
                    │ 2. Claude API format (legacy)       │
                    │ 3. OpenAI string output             │
                    │ 4. OpenAI object output             │
                    │ 5. Stringified JSON                 │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │   Parsed Scraper Output:            │
                    │                                     │
                    │ • practice_name                     │
                    │ • resulting_url                     │
                    │ • person_in_charge                  │
                    │   - name                            │
                    │   - role                            │
                    │   - credentials                     │
                    │ • staff_list[]                      │
                    │   - name                            │
                    │   - role                            │
                    │   - credentials                     │
                    │ • locations[]                       │
                    │ • practice_specialties[]            │
                    │ • works_multiple_locations          │
                    │ • scrape_notes                      │
                    │ • phone, email, website             │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │ transformScraperOutputToLeadData()  │
                    │ (utils/scraper-transformer.ts)      │
                    │                                     │
                    │ SINGLE SOURCE OF TRUTH              │
                    │ • Counts dentists/hygienists        │
                    │ • Transforms locations              │
                    │ • Merges all staff lists            │
                    │ • Returns LeadData format           │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │         LeadData Interface          │
                    │                                     │
                    │ • practiceName                      │
                    │ • practiceAddress                   │
                    │ • practiceWebsite                   │
                    │ • practicePhone                     │
                    │ • practiceEmail                     │
                    │ • practiceSpecialty                 │
                    │ • numberOfDentists                  │
                    │ • numberOfHygienists                │
                    │ • staff[]                           │
                    │ • locations[]                       │
                    │ • specialties[]                     │
                    │ • resultingUrl                      │
                    │ • personInCharge                    │
                    │ • worksMultipleLocations            │
                    │ • scrapeNotes                       │
                    └─────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │       LeadView Component            │
                    │      (components/lead-view.tsx)     │
                    └─────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┬─────────────────┐
                    │                               │                 │
                    ▼                               ▼                 ▼
        ┌─────────────────────┐       ┌─────────────────────┐   ┌──────────┐
        │   Overview Tab      │       │    Staff Tab        │   │Locations │
        │                     │       │                     │   │Analytics │
        │ • Practice Info     │       │ Name | Role |      │   │Research  │
        │ • Specialties       │       │ Credentials |      │   │Contact   │
        │ • Source Info       │       │ Location...        │   └──────────┘
        │   - Source URL      │       │                    │
        │   - Person in       │       │ Shows all staff    │
        │     Charge          │       │ with credentials   │
        │   - Multiple Locs   │       │                    │
        │ • Scrape Notes      │       └────────────────────┘
        └─────────────────────┘
```

## Key Components

### 1. Data Fetching Hook (`hooks/useJobData.ts`)

**Purpose**: Fetch full job data from database

**Interface**:
```typescript
export interface UseJobDataReturn {
  job: EnrichmentJob | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useJobData(correlationId: string): UseJobDataReturn
```

**Features**:
- Fetches complete job record from database
- Auto-refreshes when correlationId changes
- Provides refetch function for manual updates
- Handles loading and error states

### 2. Parser Utility (`utils/scraper-parser.ts`)

**Purpose**: Parse OpenAI Responses API output with multiple strategies

**Functions**:
- `parseScraperWorkerResults(scraperWorkerResultsJson)` - Tries 5 different parsing strategies
- `scraperOutputToEnrichedJson(scraperOutput)` - Converts to enriched format (compatibility)
- `extractScraperMetadata(scraperOutput)` - Returns scraper-specific fields

**Parsing Strategies** (in order):
1. **Direct Object**: Already parsed JSON with `practice_name` field
2. **Claude API Format**: Nested `output[0].content[0].text` structure (legacy)
3. **OpenAI String Output**: `{ output: "JSON_STRING" }`
4. **OpenAI Object Output**: `{ output: { practice_name: ... } }`
5. **Stringified JSON**: Entire response is a JSON string

**Console Logging**:
The parser logs detailed information to help debug data structure issues:
- `📦 Type:` - Data type received
- `📦 Keys:` - Object keys present
- `✅ Strategy X:` - Which parsing strategy succeeded
- `❌ No valid parsing strategy found` - Shows full data structure if parsing fails

### 3. Transformer Utility (`utils/scraper-transformer.ts`)

**Purpose**: SINGLE SOURCE OF TRUTH for transforming scraper output to LeadData

**Function**:
```typescript
export function transformScraperOutputToLeadData(
  scraperWorkerResultsJson: any
): LeadData
```

**Features**:
- Automatically calls parser internally
- Counts dentists/hygienists by role keywords
- Transforms locations to standard format
- Merges staff from multiple sources (person_in_charge, staff_list, location staff)
- Handles missing data gracefully
- Used by ALL components (results page, API route)

**Data Sources Merged**:
1. Person in charge → Staff list (marked as "Main Office")
2. staff_list → Staff list
3. Location staff → Staff list (marked with location name)

### 4. LeadView Component (`components/lead-view.tsx`)

**New Fields in LeadData Interface**:
```typescript
export interface LeadData {
  // Basic info
  practiceName: string
  practiceAddress: string
  practiceWebsite?: string
  practicePhone?: string
  practiceEmail?: string
  practiceSpecialty: string
  
  // Counts
  numberOfDentists: number
  numberOfHygienists: number
  
  // Lists
  staff: StaffMember[]
  locations?: Location[]
  specialties?: string[]
  
  // Scraper metadata
  resultingUrl?: string
  personInCharge?: {
    name: string
    role: string
    credentials?: string
  }
  worksMultipleLocations?: boolean
  scrapeNotes?: string
}
```

**UI Features**:
- **Source Information Card**: Shows scraped URL, person in charge, multiple location status
- **Scrape Notes Card**: AI-generated notes about scraping process
- **Credentials Column**: Professional credentials in staff table
- **Conditional Rendering**: Only shows scraper data when available

## Architecture Decisions

### Centralized Transformer
All transformation logic lives in `utils/scraper-transformer.ts`. This ensures:
- **Consistency**: Same transformation everywhere
- **Maintainability**: Single place to update logic
- **Testability**: One function to test

Used by:
- `app/results/[id]/page.tsx` - Results detail page
- `app/api/check-job-status/route.ts` - Status API endpoint

### Multiple Parsing Strategies
The parser tries 5 strategies because n8n might store OpenAI data in different formats:
- Direct database inserts
- API responses wrapped in n8n structure
- String vs object storage

### No Mock Data
All data comes from the database via:
1. Direct database queries (results pages)
2. API endpoints (status polling)

## Files Reference

### Core Implementation
- ✅ `hooks/useJobData.ts` - Database fetching hook
- ✅ `utils/scraper-parser.ts` - OpenAI response parser
- ✅ `utils/scraper-transformer.ts` - Centralized transformer (SINGLE SOURCE OF TRUTH)
- ✅ `components/lead-view.tsx` - Display component
- ✅ `app/results/[id]/page.tsx` - Results detail page
- ✅ `app/api/check-job-status/route.ts` - Status API endpoint
- ✅ `app/results/page.tsx` - Results list page

### Type Definitions
- ✅ `types/database.types.ts` - Database schema types
  - `EnrichmentJob` - Job record type
  - `scraper_worker_results_jsonb: Json | null` - OpenAI response storage

## Integration Points

### Results Detail Page (`app/results/[id]/page.tsx`)
```typescript
const { job, loading, error } = useJobData(correlationId)

useEffect(() => {
  if (job?.overall_job_status === 'scraper_worker_complete' 
      && job.scraper_worker_results_jsonb) {
    const transformedData = transformScraperOutputToLeadData(
      job.scraper_worker_results_jsonb
    )
    setLeadData(transformedData)
  }
}, [job])
```

### Status API Endpoint (`app/api/check-job-status/route.ts`)
```typescript
if (jobData.overall_job_status === 'scraper_worker_complete') {
  const leadData = transformScraperOutputToLeadData(
    jobData.scraper_worker_results_jsonb
  )
  return Response.json({ success: true, status: 'completed', data: leadData })
}
```

## Debugging

### Enable Console Logging
The parser automatically logs:
1. Raw data received from database
2. Parsing strategy attempts
3. Successful strategy used
4. Final transformed data

### Check Browser Console
When clicking a completed job, look for:
- `🔍 Raw scraper_worker_results_jsonb:` - Shows database data
- `🔍 Attempting to parse scraper_worker_results_jsonb...` - Parser start
- `📦 Type:` and `📦 Keys:` - Data structure info
- `✅ Strategy X:` - Which parsing method worked
- `📊 Transformed lead data:` - Final output

### Common Issues

**Issue**: "No valid parsing strategy found"
**Solution**: Check console for full data structure, add new parsing strategy if needed

**Issue**: Data shows but fields are empty
**Solution**: Check field names in parser output match transformer expectations

**Issue**: Staff count is 0
**Solution**: Verify role keywords in transformer (dentist, dds, dmd, hygienist)

## Testing

### Test Data Structure
Use Supabase to inspect actual data:
```sql
SELECT 
  correlation_id,
  overall_job_status,
  scraper_worker_results_jsonb
FROM enrichment_jobs
WHERE overall_job_status = 'scraper_worker_complete'
LIMIT 1;
```

### Verify Parser
Check browser console logs when viewing a completed job to see which parsing strategy succeeded.

### Verify Transformer
Console logs show the final `LeadData` object. Verify all expected fields are populated.

## Future Enhancements

Potential improvements:
- Add caching for parsed results
- Store parsed data in separate column for faster access
- Add data validation before transformation
- Include parser version in database for migration tracking
- Add metrics for which parsing strategies are most common
