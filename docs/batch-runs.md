# Batch Runs System

This document describes the batch runs system that tracks lead enrichment operations in Supabase.

## Overview

The batch runs system allows you to track and monitor lead enrichment operations performed by users. Each time a user uploads a file for lead enrichment, a batch run record is created in the database with status tracking and metadata.

## Database Schema

The `batch_runs` table has the following structure:

```sql
CREATE TABLE batch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  result_url TEXT,
  error_message TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Status Values

- `pending`: Initial state when batch run is created
- `processing`: Currently being processed
- `completed`: Successfully completed
- `failed`: Failed with an error

## Hooks

### useBatchRuns

Fetches all batch runs for a specific user, sorted by started_at in descending order.

```typescript
import { useBatchRuns } from '@/hooks'

function MyComponent() {
  const { batchRuns, loading, error, refetch } = useBatchRuns(userId)
  
  // batchRuns: BatchRun[]
  // loading: boolean
  // error: string | null
  // refetch: () => Promise<void>
}
```

### useCreateBatchRun

Creates a new batch run record.

```typescript
import { useCreateBatchRun } from '@/hooks'

function MyComponent() {
  const { createBatchRun, loading, error } = useCreateBatchRun()
  
  const handleFileUpload = async (file: File) => {
    const batchRun = await createBatchRun(userId, file.name, {
      fileSize: file.size,
      fileType: file.type
    })
  }
}
```

### useUpdateBatchRun

Updates an existing batch run record.

```typescript
import { useUpdateBatchRun } from '@/hooks'

function MyComponent() {
  const { updateBatchRun, loading, error } = useUpdateBatchRun()
  
  const markCompleted = async (batchRunId: string) => {
    await updateBatchRun(batchRunId, {
      status: 'completed',
      finished_at: new Date().toISOString()
    })
  }
}
```

## Integration with Lead Enrichment Form

The `LeadEnrichmentForm` component has been updated to automatically:

1. Create a batch run when a file is uploaded
2. Update the batch run with parsing metadata
3. Update status to 'processing' when enrichment starts
4. Update status to 'completed' or 'failed' based on the result

## Components

### BatchRunsList

A ready-to-use component that displays all batch runs for the current user:

```typescript
import BatchRunsList from '@/components/batch-runs-list'

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <BatchRunsList />
    </div>
  )
}
```

## Usage Example

Here's a complete example of how to use the batch runs system:

```typescript
import { useUsers, useCreateBatchRun, useUpdateBatchRun } from '@/hooks'

function FileProcessor() {
  const { user } = useUsers()
  const { createBatchRun } = useCreateBatchRun()
  const { updateBatchRun } = useUpdateBatchRun()

  const processFile = async (file: File) => {
    if (!user?.id) return

    // Create batch run
    const batchRun = await createBatchRun(user.id, file.name, {
      fileSize: file.size,
      fileType: file.type
    })

    if (!batchRun) {
      console.error('Failed to create batch run')
      return
    }

    try {
      // Update status to processing
      await updateBatchRun(batchRun.id, {
        status: 'processing',
        started_at: new Date().toISOString()
      })

      // Process the file...
      const result = await processFileData(file)

      // Update status to completed
      await updateBatchRun(batchRun.id, {
        status: 'completed',
        finished_at: new Date().toISOString(),
        result_url: result.url
      })

    } catch (error) {
      // Update status to failed
      await updateBatchRun(batchRun.id, {
        status: 'failed',
        error_message: error.message,
        finished_at: new Date().toISOString()
      })
    }
  }

  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
    />
  )
}
```

## Error Handling

All hooks include proper error handling and will return error messages when operations fail. The batch runs system gracefully handles:

- Network errors
- Database connection issues
- Invalid data
- Missing user authentication

## Security

The batch runs system uses Row Level Security (RLS) policies to ensure users can only access their own batch runs. Make sure to set up appropriate RLS policies in your Supabase database:

```sql
-- Enable RLS
ALTER TABLE batch_runs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own batch runs
CREATE POLICY "Users can view own batch runs" ON batch_runs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own batch runs
CREATE POLICY "Users can insert own batch runs" ON batch_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own batch runs
CREATE POLICY "Users can update own batch runs" ON batch_runs
  FOR UPDATE USING (auth.uid() = user_id);
``` 