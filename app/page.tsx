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
import Footer from "../components/footer"
import ProcessRequest from "../components/process-request"
import { AuthGuard } from "@/components/auth-guard"
import { useUsers } from "@/hooks/useUsers"
import LeadSearchForm from "@/components/lead-search-form"
import EnrichPage from "./enrich/page"

export default function LeadDeskForm() {
  return (
    <EnrichPage />
  )
}