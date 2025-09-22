"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import LeadSearchComplete from "@/components/completion"
import { AppHeader } from "@/components/appheader"
import ProcessRequest from "../components/process-request"
import { AuthGuard } from "@/components/auth-guard"
import { useUsers } from "@/hooks/useUsers"
import LeadSearchForm from "@/components/lead-search-form"
import Searchbar from "@/components/Searchbar"
export default function LeadDeskForm() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <AppHeader />
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full flex flex-col items-center justify-center -mt-24">
            <Searchbar />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}