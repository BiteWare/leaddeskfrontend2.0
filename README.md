# LeadDesk Frontend 2.0

Modern lead enrichment platform for dental practices, built with Next.js 14, TypeScript, and Supabase.

## Overview

LeadDesk automates dental practice research by:
1. Accepting practice information (name, city, state)
2. Finding the practice website using OpenAI
3. Scraping and analyzing website content
4. Presenting enriched data in a beautiful UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Backend**: n8n workflows with OpenAI Responses API
- **Icons**: Lucide React

## Project Structure

```
leaddeskfrontend2.0/
├── app/
│   ├── api/
│   │   ├── submit-leaddesk/       # Submit new enrichment jobs
│   │   ├── check-job-status/      # Check job status (legacy)
│   │   └── search-practices/      # Search existing practices
│   ├── auth/                      # Authentication pages
│   ├── results/
│   │   ├── page.tsx               # Jobs list
│   │   └── [id]/
│   │       └── page.tsx           # Job results detail
│   ├── page.tsx                   # Main search/submit page
│   └── layout.tsx                 # Root layout
├── components/
│   ├── ui/                        # Shadcn UI components
│   ├── lead-view.tsx              # Main results display
│   ├── jobs-table.tsx             # Jobs list table
│   ├── app-sidebar-custom.tsx     # Navigation sidebar
│   └── Searchbar.tsx              # Search input
├── hooks/
│   ├── useJobData.ts              # Fetch job from database
│   ├── useUsers.ts                # User authentication
│   └── index.ts                   # Hook exports
├── utils/
│   ├── scraper-parser.ts          # Parse OpenAI responses
│   ├── scraper-transformer.ts     # Transform to UI format
│   ├── supabase-client.ts         # Supabase client
│   └── supabase.ts                # Auth helpers
├── types/
│   └── database.types.ts          # Database schema types
└── project-docs/
    ├── scraper-integration.md     # Data parsing docs
    ├── data-flow.md               # Architecture overview
    ├── batch-runs.md              # Batch processing (legacy)
    ├── leadview-component.md      # LeadView usage guide
    └── sidebar-implementation.md  # Sidebar docs
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- n8n instance (for backend workflows)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd leaddeskfrontend2.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

### 1. Create Tables

```sql
-- Users table (handled by Supabase Auth)

-- Enrichment jobs table
CREATE TABLE enrichment_jobs (
  correlation_id TEXT PRIMARY KEY,
  run_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  overall_job_status TEXT,
  input_customer_name TEXT,
  input_street_address TEXT,
  input_city TEXT,
  input_state TEXT,
  url_worker_job_id TEXT,
  url_worker_results_jsonb JSONB,
  scraper_worker_job_id TEXT,
  scraper_worker_results_jsonb JSONB,
  url_worker_resulting_url TEXT
);
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs" ON enrichment_jobs
  FOR SELECT USING (auth.uid()::text = run_user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can insert own jobs" ON enrichment_jobs
  FOR INSERT WITH CHECK (auth.uid()::text = run_user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update own jobs" ON enrichment_jobs
  FOR UPDATE USING (auth.uid()::text = run_user_id);
```

### 3. Create Indexes

```sql
CREATE INDEX idx_enrichment_jobs_user_id ON enrichment_jobs(run_user_id);
CREATE INDEX idx_enrichment_jobs_status ON enrichment_jobs(overall_job_status);
CREATE INDEX idx_enrichment_jobs_created_at ON enrichment_jobs(created_at DESC);
```

## Data Flow

### 1. User Submits Search
```
User enters practice info → POST /api/submit-leaddesk → n8n webhook → DB
```

### 2. n8n Backend Processing
```
Dispatcher → URL Worker → Scraper Worker → Polling Aggregator → Update DB
```

### 3. Frontend Displays Results
```
useJobData hook → Parse OpenAI response → Transform to LeadData → Display in LeadView
```

See [project-docs/data-flow.md](project-docs/data-flow.md) for detailed architecture.

## Key Features

### 🔍 Smart Search
- Enter practice name, city, state
- Automatically finds website
- Scrapes and analyzes content

### 📊 Rich Data Display
- **Overview**: Practice info, specialties, source data
- **Staff**: Full directory with credentials
- **Locations**: Multiple office locations
- **Contact**: Phone, email, website
- **Analytics**: Staff distribution charts
- **Research**: AI reasoning steps

### 🔐 Secure Authentication
- Email/password auth via Supabase
- Row-level security on all data
- User-specific job lists

### 🎨 Modern UI
- Responsive design
- Dark mode support (via Tailwind)
- Clean, professional interface
- Fast loading with optimistic updates

## Core Components

### `useJobData` Hook
Fetches job data from database:
```typescript
const { job, loading, error, refetch } = useJobData(correlationId)
```

### `parseScraperWorkerResults`
Parses OpenAI Responses API output with 5 fallback strategies:
```typescript
const scraperOutput = parseScraperWorkerResults(scraperWorkerResultsJson)
```

### `transformScraperOutputToLeadData`
SINGLE SOURCE OF TRUTH for data transformation:
```typescript
const leadData = transformScraperOutputToLeadData(scraperWorkerResultsJson)
```

### `<LeadView />`
Main display component with tabs:
```typescript
<LeadView leadData={leadData} />
```

## Job Status Flow

1. `pending_url_search` - Submitted, searching for website
2. `url_worker_called` - URL search in progress
3. `url_worker_complete` - Website found
4. `scraper_worker_called` - Analyzing website
5. `scraper_worker_complete` - ✅ Complete, data ready

## API Endpoints

### `POST /api/submit-leaddesk`
Submit new enrichment job
```typescript
{
  customerName: string
  city?: string
  state?: string
  streetAddress?: string
}
```

### `POST /api/check-job-status`
Check job status (legacy, direct DB queries preferred)
```typescript
{
  correlation_id: string
}
```

### `POST /api/search-practices`
Search existing practices (future feature)

## Development

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS for styling
- Shadcn UI for components

### Testing
Currently manual testing. Future: Add Jest + React Testing Library.

### Debugging
Enable detailed console logging:
- `🔍` - Data fetching
- `📦` - Data structure
- `✅` - Success
- `❌` - Errors
- `📊` - Transformation

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_N8N_WEBHOOK_URL`

### Build
```bash
npm run build
npm run start
```

## Documentation

- [Scraper Integration](project-docs/scraper-integration.md) - Data parsing and transformation
- [Data Flow](project-docs/data-flow.md) - Complete architecture overview
- [LeadView Component](project-docs/leadview-component.md) - Display component guide
- [Sidebar Implementation](project-docs/sidebar-implementation.md) - Navigation docs

## Troubleshooting

### "No valid parsing strategy found"
Check browser console for data structure. Add new parsing strategy to `scraper-parser.ts` if needed.

### RLS Errors
Verify user is authenticated and RLS policies are correct:
```sql
SELECT * FROM enrichment_jobs WHERE run_user_id = auth.uid()::text;
```

### Job Not Updating
Database is queried once per page load. Manually refresh to see updates (or implement polling).

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit PR

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

