# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeadDesk is a dental practice lead enrichment platform. It accepts practice information (name, city, state), finds the practice website using OpenAI, scrapes and analyzes website content via n8n workflows, and presents enriched data in a Next.js frontend.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI primitives)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Backend**: n8n workflows with OpenAI Responses API
- **Forms**: React Hook Form + Zod validation

## Development Commands

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture Overview

### Data Flow

1. **Job Submission**: User submits practice info → `POST /api/submit-leaddesk` → n8n webhook → Creates DB record with `correlation_id`
2. **Backend Processing**: n8n dispatcher → URL Worker (finds website) → Scraper Worker (OpenAI analyzes site) → Polling Aggregator → Updates DB
3. **Frontend Display**: `useJobData` hook → `parseScraperWorkerResults()` → `transformScraperOutputToLeadData()` → `<LeadView />` component

### Job Status Flow

Jobs progress through these statuses:
- `pending_url_search` → `url_worker_called` → `url_worker_complete` → `scraper_worker_called` → `scraper_worker_complete` (ready to display)

### Critical Architecture Patterns

**SINGLE SOURCE OF TRUTH for Data Transformation**: All scraper data transformation MUST use `utils/scraper-transformer.ts::transformScraperOutputToLeadData()`. This function is called by:
- `app/results/[id]/page.tsx` (results detail page)
- `app/api/check-job-status/route.ts` (status API endpoint)

**Multi-Strategy Parser**: `utils/scraper-parser.ts::parseScraperWorkerResults()` tries 6 parsing strategies because OpenAI Responses API data can be stored in different formats by n8n:
1. Direct object (already parsed)
2. Array of output items with assistant message
3. Legacy Claude API format
4. OpenAI string output
5. OpenAI object output
6. Stringified JSON

**Row Level Security**: Database enforces users can only see their own jobs via RLS policies. No additional auth checks needed in frontend.

## Database Schema

### `enrichment_jobs` Table

Key fields:
- `correlation_id` (PK) - Unique job identifier
- `run_user_id` - Links to authenticated user
- `overall_job_status` - Current job state
- `input_customer_name`, `input_city`, `input_state` - User input
- `url_worker_resulting_url` - Found website URL
- `scraper_worker_results_jsonb` - OpenAI Responses API output (JSON)

RLS policies ensure users only access their own jobs.

## Code Organization

### `/app` - Next.js App Router

- `page.tsx` - Main search/submit page
- `results/page.tsx` - Jobs list table
- `results/[id]/page.tsx` - Job detail page (server component)
- `results/[id]/job-results-client.tsx` - Client component for results display
- `auth/page.tsx` - Authentication page
- `api/submit-leaddesk/route.ts` - Submit new enrichment job
- `api/check-job-status/route.ts` - Legacy status check (prefer direct DB queries)

### `/components`

- `ui/` - Shadcn UI components (auto-generated, edit with caution)
- `lead-view.tsx` - Main results display with tabs (Overview, Staff, Locations, Contact, Analytics, Research)
- `jobs-table.tsx` - Jobs list table component
- `app-sidebar-custom.tsx` - Navigation sidebar

### `/hooks`

- `useJobData.ts` - Fetches job from database with loading/error states
- `useUsers.ts` - User authentication hook
- `index.ts` - Hook exports

### `/utils`

**CRITICAL**: These two files are the core of data transformation:
- `scraper-parser.ts` - Parses OpenAI Responses API output (6 fallback strategies)
- `scraper-transformer.ts` - Transforms scraper output to LeadData format (SINGLE SOURCE OF TRUTH)

Other utilities:
- `supabase-client.ts` - Supabase client initialization
- `supabase.ts` - Auth helpers

### `/types`

- `database.types.ts` - Generated from Supabase schema (auto-generated)

### `/lib`

- `utils.ts` - Common utilities (cn() for class merging)

## Important Patterns & Conventions

### Data Transformation Rules

1. **Always use the centralized transformer**: Never parse scraper data directly. Always call `transformScraperOutputToLeadData()`.
2. **Staff deduplication**: Transformer merges staff from 3 sources (person_in_charge, staff_list, location staff) and deduplicates by name.
3. **Fallback to job input**: When scraper data is missing, transformer falls back to original user input (`input_customer_name`, `input_city`, etc.).
4. **Empty string normalization**: Use `normalizeValue()` to convert empty strings to undefined so UI shows "Not available" instead of blank.

### Component Patterns

```typescript
// Standard loading pattern
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data) return <EmptyState />
return <DataView data={data} />

// Data fetching hook pattern
const { job, loading, error, refetch } = useJobData(correlationId)
```

### Authentication Flow

- Middleware protects `/admin/*` routes only
- Main app pages are public but personalized when logged in
- RLS ensures data isolation without frontend checks
- Use `useUsers()` hook to access current user state

### Debugging

Console logging is extensive throughout the parser and transformer:
- `🔍` Data fetching
- `📦` Data structure inspection
- `✅` Success/completion
- `❌` Errors
- `🔧` Transformation steps
- `📊` Final output

When debugging data issues, check browser console for these logs to see which parsing strategy was used and inspect the data structure.

## Common Tasks

### Adding New Scraper Output Fields

1. Add field to `ScraperWorkerOutput` interface in `utils/scraper-parser.ts`
2. Update `transformScraperOutputToLeadData()` in `utils/scraper-transformer.ts`
3. Add field to `LeadData` interface in `components/lead-view.tsx`
4. Update UI to display new field in appropriate tab

### Modifying Job Status Flow

Job status is managed entirely by n8n backend. Frontend only reads status from database. To change status transitions, modify n8n workflows.

### Adding UI Components

Use Shadcn CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```

Components are added to `components/ui/` and can be imported directly.

### Database Changes

1. Update Supabase schema via SQL editor
2. Regenerate types: `npx supabase gen types typescript --project-id [project-id] > types/database.types.ts`
3. Update RLS policies if needed

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Key Files to Understand

1. `utils/scraper-transformer.ts` - ALL data transformation logic
2. `utils/scraper-parser.ts` - OpenAI response parsing strategies
3. `hooks/useJobData.ts` - Database fetching pattern
4. `components/lead-view.tsx` - Main UI component structure
5. `app/results/[id]/page.tsx` - Results page architecture
6. `middleware.ts` - Authentication routing
7. `project-docs/data-flow.md` - Detailed architecture documentation
8. `project-docs/scraper-integration.md` - Parser/transformer deep dive

## Testing Approach

Currently manual testing. When adding automated tests:
- Test `parseScraperWorkerResults()` with all 6 parsing strategies
- Test `transformScraperOutputToLeadData()` with complete and partial data
- Test LeadView component with missing/optional data
- Test RLS policies in Supabase

## Known Constraints

- No real-time updates: Database is queried once per page load, user must refresh manually
- No batch operations UI: Jobs are submitted individually
- Parser assumes OpenAI output follows specific JSON schema
- Staff role counting uses keyword matching (dentist, dds, dmd, hygienist)
