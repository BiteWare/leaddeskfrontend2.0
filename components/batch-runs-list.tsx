"use client"

import { useUsers, useBatchRuns } from "@/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export default function BatchRunsList() {
  const { user } = useUsers()
  const { batchRuns, loading, error, refetch } = useBatchRuns(user?.id || "")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Runs</CardTitle>
          <CardDescription>Please sign in to view your batch runs</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Runs</CardTitle>
          <CardDescription>Loading your batch runs...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Runs</CardTitle>
          <CardDescription>Error loading batch runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Batch Runs</CardTitle>
            <CardDescription>Your recent lead enrichment runs</CardDescription>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {batchRuns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No batch runs found</p>
            <p className="text-sm">Upload a file to create your first batch run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batchRuns.map((run) => (
              <div
                key={run.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{run.filename}</span>
                      <Badge className={getStatusColor(run.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(run.status)}
                          {run.status}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Started:</span>
                        <br />
                        {formatDate(run.started_at)}
                      </div>
                      <div>
                        <span className="font-medium">Finished:</span>
                        <br />
                        {formatDate(run.finished_at)}
                      </div>
                      <div>
                        <span className="font-medium">Rows:</span>
                        <br />
                        {typeof run.meta === 'object' && run.meta && 'rowCount' in run.meta 
                          ? String(run.meta.rowCount) 
                          : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span>
                        <br />
                        {typeof run.meta === 'object' && run.meta && 'fileSize' in run.meta && typeof run.meta.fileSize === 'number'
                          ? `${(run.meta.fileSize / 1024).toFixed(1)} KB` 
                          : 'N/A'}
                      </div>
                    </div>

                    {run.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Error:</strong> {run.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 