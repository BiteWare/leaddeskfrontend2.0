"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

interface JobErrorDisplayProps {
  onRetry: () => void
}

export default function JobErrorDisplay({ onRetry }: JobErrorDisplayProps) {
  return (
    <div className="text-center mt-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div>
            <p className="text-red-800 font-medium text-sm">Failed to submit enrichment job</p>
          </div>
          <button
            onClick={onRetry}
            className="mt-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  )
}
