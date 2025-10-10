"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobsTable } from '@/components/jobs-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Users, RefreshCw } from 'lucide-react'
import type { EnrichmentJob } from '@/types/database.types'

interface JobResultsClientProps {
  userJobs: EnrichmentJob[]
  allJobs: EnrichmentJob[]
  correlationId?: string
}

export function JobResultsClient({ userJobs, allJobs, correlationId }: JobResultsClientProps) {
  const [showAllJobs, setShowAllJobs] = useState(false)
  const router = useRouter()

  const displayedJobs = showAllJobs ? allJobs : userJobs

  return (
    <div className="space-y-6">
      {/* Clean Jobs History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jobs History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant={!showAllJobs ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllJobs(false)}
              >
                <User className="h-4 w-4 mr-2" />
                My Jobs
              </Button>
              <Button
                variant={showAllJobs ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllJobs(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                All Jobs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <JobsTable jobs={displayedJobs} />
        </CardContent>
      </Card>
    </div>
  )
}
