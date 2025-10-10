# LeadDesk Frontend - Data Flow Architecture

## Overview

This document describes how data flows through the LeadDesk frontend application, from n8n backend workflows to the UI display.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         N8N Backend                              │
│                                                                  │
│  Dispatcher → URL Worker → Scraper Worker → Polling Aggregator  │
│                                                                  │
│                    Updates Supabase Database                     │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase Database                             │
│                                                                  │
│  enrichment_jobs table:                                          │
│  • correlation_id (PK)                                           │
│  • overall_job_status                                            │
│  • input_customer_name, input_city, input_state                 │
│  • url_worker_results_jsonb                                      │
│  • scraper_worker_results_jsonb ← OpenAI Responses API output   │
│  • url_worker_resulting_url                                      │
│  • run_user_id, created_at                                       │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend Application                          │
│                                                                  │
│  1. Submit Search (app/page.tsx)                                 │
│     ↓                                                            │
│  2. POST /api/submit-leaddesk                                    │
│     ↓                                                            │
│  3. Navigate to /results/[correlation_id]                        │
│     ↓                                                            │
│  4. useJobData hook fetches from DB                              │
│     ↓                                                            │
│  5. Parse & Transform (utils/)                                   │
│     ↓                                                            │
│  6. Display in LeadView component                                │
└──────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### 1. Job Submission

**File**: `app/page.tsx`

**User Action**: Enters practice info and clicks "Enrich Lead"

**Process**:
```typescript
const handleSearch = async (query: string) => {
  // POST to submission endpoint
  const response = await fetch('/api/submit-leaddesk', {
    method: 'POST',
    body: JSON.stringify({ customerName, city, state })
  })
  
  const { correlationId } = await response.json()
  
  // Navigate to results page
  router.push(`/results/${correlationId}`)
}
```

**Output**: 
- `correlation_id` created
- Job record inserted in database with status `pending_url_search`
- User redirected to `/results/[correlation_id]`

---

### 2. Job Monitoring

**File**: `app/results/[id]/page.tsx`

**Hook**: `useJobData(correlationId)`

**Process**:
```typescript
// Hook automatically fetches job from database
const { job, loading, error } = useJobData(correlationId)

// When job completes, transform data
useEffect(() => {
  if (job?.overall_job_status === 'scraper_worker_complete' 
      && job.scraper_worker_results_jsonb) {
    const leadData = transformScraperOutputToLeadData(
      job.scraper_worker_results_jsonb
    )
    setLeadData(leadData)
  }
}, [job])
```

**Database Query**:
```typescript
// hooks/useJobData.ts
const { data: jobData, error } = await supabase
  .from('enrichment_jobs')
  .select('*')
  .eq('correlation_id', correlationId)
  .single()
```

**Job Status Flow**:
1. `pending_url_search` → Looking for website
2. `url_worker_called` → URL search in progress
3. `url_worker_complete` → Website found
4. `scraper_worker_called` → Analyzing website
5. `scraper_worker_complete` → **Data ready to display**

---

### 3. Data Parsing

**File**: `utils/scraper-parser.ts`

**Function**: `parseScraperWorkerResults(scraperWorkerResultsJson)`

**Purpose**: Extract JSON from OpenAI Responses API format

**Strategies Tried** (in order):
1. Direct object (already parsed)
2. Claude API format (legacy, for compatibility)
3. OpenAI string output: `{ output: "JSON_STRING" }`
4. OpenAI object output: `{ output: { ... } }`
5. Stringified JSON

**Example Input** (OpenAI format):
```json
{
  "output": "{\"practice_name\":\"Example Dental\",\"resulting_url\":\"https://example.com\", ...}"
}
```

**Example Output**:
```typescript
{
  practice_name: "Example Dental",
  resulting_url: "https://example.com",
  person_in_charge: {
    name: "Dr. Smith",
    role: "Owner",
    credentials: "DDS"
  },
  staff_list: [...],
  locations: [...],
  practice_specialties: [...],
  works_multiple_locations: true,
  scrape_notes: "Successfully scraped...",
  phone: "(555) 123-4567",
  email: "info@example.com"
}
```

---

### 4. Data Transformation

**File**: `utils/scraper-transformer.ts`

**Function**: `transformScraperOutputToLeadData(scraperWorkerResultsJson)`

**Purpose**: Convert scraper output to UI-friendly LeadData format

**Process**:
1. **Parse**: Call `parseScraperWorkerResults()`
2. **Count Staff**: Filter by role (dentist, hygienist)
3. **Transform Locations**: Add IDs, format fields
4. **Merge Staff Lists**:
   - Person in charge
   - Main staff list
   - Staff from each location
5. **Return LeadData**: Structured object for UI

**Transformation Example**:
```typescript
// Input: Scraper output
{
  staff_list: [
    { name: "Dr. Smith", role: "Dentist", credentials: "DDS" },
    { name: "Jane Doe", role: "Dental Hygienist", credentials: "RDH" }
  ]
}

// Output: LeadData format
{
  numberOfDentists: 1,  // Counted by role
  numberOfHygienists: 1, // Counted by role
  staff: [
    {
      name: "Dr. Smith",
      role: "Dentist",
      credentials: "DDS",
      location: undefined,
      phone: undefined,
      email: undefined
    },
    {
      name: "Jane Doe",
      role: "Dental Hygienist",
      credentials: "RDH",
      location: undefined,
      phone: undefined,
      email: undefined
    }
  ]
}
```

---

### 5. Data Display

**File**: `components/lead-view.tsx`

**Component**: `<LeadView leadData={leadData} />`

**Features**:
- **Tabs**: Overview, Locations, Staff, Contact, Analytics, Research
- **Overview Tab**: Practice info, specialties, source info, scrape notes
- **Staff Tab**: Searchable/filterable table with credentials
- **Locations Tab**: Office locations with staff counts
- **Contact Tab**: Phone, email, addresses
- **Analytics Tab**: Role distribution, staff statistics
- **Research Tab**: AI reasoning steps (placeholder)

**Data Binding**:
```typescript
export default function LeadView({ leadData }: LeadViewProps) {
  const {
    practiceName,        // → Header
    practiceSpecialty,   // → Badge
    numberOfDentists,    // → Stats card
    numberOfHygienists,  // → Stats card
    staff,              // → Staff table
    locations,          // → Locations table
    specialties,        // → Badges
    resultingUrl,       // → Source info card
    personInCharge,     // → Source info card
    scrapeNotes        // → Scrape notes card
  } = leadData
  
  return (/* UI */)
}
```

---

## API Endpoints

### POST `/api/submit-leaddesk`

**Purpose**: Submit new lead enrichment job

**Request**:
```typescript
{
  customerName: string
  city?: string
  state?: string
  streetAddress?: string
}
```

**Response**:
```typescript
{
  success: boolean
  correlationId: string
  message: string
}
```

**Process**:
1. Validate input
2. Call n8n webhook
3. Return correlation_id
4. n8n creates database record

---

### POST `/api/check-job-status`

**Purpose**: Check job status and get results (currently unused, direct DB queries preferred)

**Request**:
```typescript
{
  correlation_id: string
}
```

**Response**:
```typescript
{
  success: boolean
  status: string
  message?: string
  data?: LeadData  // Only when status is 'completed'
  created_at?: string
}
```

---

## Database Schema

### `enrichment_jobs` Table

```sql
CREATE TABLE enrichment_jobs (
  correlation_id TEXT PRIMARY KEY,
  run_user_id TEXT,
  created_at TIMESTAMPTZ,
  overall_job_status TEXT,
  input_customer_name TEXT,
  input_street_address TEXT,
  input_city TEXT,
  input_state TEXT,
  url_worker_job_id TEXT,
  url_worker_results_jsonb JSONB,
  scraper_worker_job_id TEXT,
  scraper_worker_results_jsonb JSONB,  -- OpenAI Responses API output
  url_worker_resulting_url TEXT
);
```

---

## State Management

### No Global State Manager

The app uses React hooks and local state:
- `useState` for component state
- `useEffect` for side effects
- Custom hooks (`useJobData`, `useUsers`) for data fetching

### Why No Redux/Zustand?

- Simple data flow (mostly read-only)
- Data comes directly from database
- No complex client-side state to manage
- React Query-style hooks provide what we need

---

## Error Handling

### Database Errors
```typescript
// hooks/useJobData.ts
if (jobError) {
  setError(jobError.message)
}
```

### Parsing Errors
```typescript
// utils/scraper-parser.ts
try {
  return JSON.parse(textContent)
} catch (error) {
  console.error('Failed to parse:', error)
  return null
}
```

### UI Handling
```typescript
// app/results/[id]/page.tsx
if (error) {
  return <div>Error: {error}</div>
}

if (!job) {
  return <div>Job not found</div>
}

if (job.status !== 'scraper_worker_complete') {
  return <div>Job is processing...</div>
}
```

---

## Performance Considerations

### Database Queries
- Single query per job view (no polling)
- User refreshes manually if needed
- RLS policies filter by user automatically

### Data Transformation
- Runs client-side (one-time per job view)
- Cached in component state
- No re-transformation on re-renders

### Component Rendering
- LeadView uses `useMemo` for filtered data
- Large staff lists handled efficiently
- Tabs prevent rendering all data at once

---

## Security

### Row Level Security (RLS)
- Database enforces user can only see their jobs
- No need for additional auth checks in frontend

### API Authentication
- Supabase client handles auth tokens
- `Authorization: Bearer <token>` header on all requests

### Data Validation
- Input validated on submit
- Parser handles malformed data gracefully
- UI handles missing data with fallbacks

---

## Testing Strategy

### Integration Testing Flow
1. Submit test job → Get correlation_id
2. Check database → Verify record created
3. Wait for completion → Status = `scraper_worker_complete`
4. View results page → Verify data displays
5. Check console logs → Verify parser used correct strategy

### Unit Testing Targets
- `parseScraperWorkerResults()` - All 5 strategies
- `transformScraperOutputToLeadData()` - Complete and partial data
- LeadView component - Missing data handling

---

## Common Patterns

### Loading States
```typescript
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data) return <EmptyState />
return <DataView data={data} />
```

### Data Fetching
```typescript
const { data, loading, error } = useCustomHook(params)
```

### Conditional Rendering
```typescript
{data?.optionalField && (
  <DisplayComponent value={data.optionalField} />
)}
```

---

## Next Steps / Future Improvements

1. **Real-time Updates**: Add websocket/polling for live status
2. **Caching**: Cache parsed results in database
3. **Export**: Add PDF/CSV export functionality
4. **Batch Operations**: Handle multiple jobs at once
5. **Advanced Filtering**: Filter jobs by status, date range
6. **Search**: Search within results data

