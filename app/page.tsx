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

export default function LeadDeskForm() {
  const { user, currentUserProfile } = useUsers()
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [url, setUrl] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayedStep, setDisplayedStep] = useState(0)
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [searchHistory, setSearchHistory] = useState<Array<{ businessType: string; location: string }>>([])
  const [showHistory, setShowHistory] = useState(false)

  const statusMessages = [
    { icon: "🔍", message: "Searching Google Maps..." },
    { icon: "📦", message: "Leads found" },
    { icon: "📞", message: "Gathering contact info..." },
    { icon: "📤", message: "Pushing leads to HubSpot..." },
    { icon: "✅", message: "Done!" },
  ]



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!businessType || !location) && !url) return

    // Create payload based on input
    let payload
    if (url) {
      payload = { url }
    } else {
      payload = { query: `${businessType}, in ${location}` }
    }

    // Send data to API endpoint
    try {
      const response = await fetch('/api/submit-leaddesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      // Optionally handle result, e.g., show error or success
      // console.log(result)
    } catch (error) {
      // Optionally handle error
      // console.error('API request failed', error)
    }

    // Add to search history
    setSearchHistory((prev) => {
      // Check if this search already exists
      const exists = prev.some((item) => item.businessType === businessType && item.location === location)

      if (!exists) {
        // Add new search to the beginning of the array
        return [{ businessType, location }, ...prev.slice(0, 4)]
      }
      return prev
    })

    setIsSubmitted(true)
    setCurrentStep(0)
    setDisplayedStep(0)
    setProgress(2) // Start with a small initial progress
    setIsAnimating(false)
    setIsFormExpanded(false) // Collapse the form on submission
    setIsComplete(false) // Reset completion state

    // Smoother progress simulation that takes ~20 seconds
    let step = 0
    let progressValue = 2

    // Calculate target progress values for each step
    const stepTargets = statusMessages.map((_, index) =>
      index === statusMessages.length - 1 ? 100 : (index + 1) * (100 / statusMessages.length),
    )

    // Update progress bar very frequently with tiny increments
    const progressInterval = setInterval(() => {
      // Calculate the current target based on which step we're on
      const currentTarget = stepTargets[step]

      if (progressValue < currentTarget) {
        // Determine how quickly to approach the target based on distance
        const distance = currentTarget - progressValue
        // Smaller increments when closer to target for natural easing
        const increment = Math.max(0.1, distance * 0.03)

        progressValue = Math.min(progressValue + increment, currentTarget)
        setProgress(progressValue)
      }

      // If we've reached 100%, clear the interval
      if (progressValue >= 100) {
        clearInterval(progressInterval)
      }
    }, 50) // Update very frequently (50ms) for smoother animation

    // Update status messages every 5 seconds
    const statusInterval = setInterval(() => {
      if (step < statusMessages.length - 1) {
        step++
        setCurrentStep(step)
      } else {
        clearInterval(statusInterval)
      }
    }, 5000) // Status messages still change every 5 seconds
  }

  const resetForm = () => {
    setBusinessType("") // Clear business type input
    setLocation("") // Clear location input
    setUrl("") // Clear URL input
    setIsSubmitted(false)
    setCurrentStep(0)
    setDisplayedStep(0)
    setProgress(0)
    setIsAnimating(false)
    setIsFormExpanded(true) // Expand the form when resetting
    setIsComplete(false) // Reset completion state
  }

  const toggleForm = () => {
    setIsFormExpanded(!isFormExpanded)
  }

  const toggleHistory = () => {
    setShowHistory(!showHistory)
  }

  const handleHistoryItemClick = (item: { businessType: string; location: string }) => {
    setBusinessType(item.businessType)
    setLocation(item.location)
    setShowHistory(false)
  }

  // Effect to handle the fade transition between steps
  useEffect(() => {
    if (isSubmitted && currentStep !== displayedStep) {
      // Start fade out
      setIsAnimating(true)

      // After fade out completes, update the displayed step and start fade in
      const timeout = setTimeout(() => {
        setDisplayedStep(currentStep)
        setIsAnimating(false)
      }, 500) // Match this to the CSS transition duration

      return () => clearTimeout(timeout)
    }
  }, [currentStep, displayedStep, isSubmitted])

  // Effect to show completion component when process is done
  useEffect(() => {
    if (isSubmitted && progress === 100 && currentStep === statusMessages.length - 1) {
      // Wait a moment after reaching 100% before showing completion
      const timeout = setTimeout(() => {
        setIsComplete(true)
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [isSubmitted, progress, currentStep, statusMessages.length])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <AppHeader />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 pt-24">
        {isComplete ? (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <LeadSearchComplete />
            <div className="mt-8 w-full max-w-sm space-y-4">
              <Button
                onClick={resetForm}
                className="w-full h-14 rounded-xl font-medium text-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300 text-white"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Search For More Leads
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Card className="w-full max-w-2xl border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <LeadSearchForm
                businessType={businessType}
                setBusinessType={setBusinessType}
                location={location}
                setLocation={setLocation}
                url={url}
                setUrl={setUrl}
                isSubmitted={isSubmitted}
                isFormExpanded={isFormExpanded}
                searchHistory={searchHistory}
                showHistory={showHistory}
                onToggleForm={toggleForm}
                onToggleHistory={toggleHistory}
                onSubmit={handleSubmit}
                onReset={resetForm}
                onHistoryItemClick={handleHistoryItemClick}
              />
            </Card>

            {isSubmitted && (
              <ProcessRequest
                progress={progress}
                isAnimating={isAnimating}
                statusMessages={statusMessages}
                displayedStep={displayedStep}
                currentStep={currentStep}
                Loader2={Loader2}
                Clock={Clock}
              >
                <div className="absolute inset-0 bg-gray-100 rounded-full overflow-hidden">
                  <Progress value={progress} className="h-full" />
                </div>
              </ProcessRequest>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
    </AuthGuard>
  )
}