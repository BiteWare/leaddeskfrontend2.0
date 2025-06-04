"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  Search,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  HelpCircle,
  Clock,
  Folder,
  RefreshCw,
  Bell,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import LeadSearchComplete from "@/components/completion"
import { UserDropdown } from "@/components/user-dropdown"
import Footer from "../components/footer"
import ProcessRequest from "../components/process-request"

export default function LeadDeskForm() {
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [url, setUrl] = useState("")
  const [urlFocused, setUrlFocused] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayedStep, setDisplayedStep] = useState(0)
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [businessTypeFocused, setBusinessTypeFocused] = useState(false)
  const [locationFocused, setLocationFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useState<Array<{ businessType: string; location: string }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [dynamicMessage, setDynamicMessage] = useState("")

  const statusMessages = [
    { icon: "🔍", message: "Searching Google Maps..." },
    { icon: "📦", message: "10 leads found" },
    { icon: "📞", message: "Gathering contact info..." },
    { icon: "📤", message: "Pushing leads to HubSpot..." },
    { icon: "✅", message: "Done!" },
  ]

  const dynamicMessages = [
    "Searching Google Maps...",
    "Analyzing business websites...",
    "Filtering by relevance...",
    "Verifying contact information...",
    "Preparing lead data...",
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
    setDynamicMessage(dynamicMessages[0])

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

  const clearBusinessType = () => {
    setBusinessType("")
  }

  const clearLocation = () => {
    setLocation("")
  }

  const clearUrl = () => {
    setUrl("")
  }

  const toggleHistory = () => {
    setShowHistory(!showHistory)
  }

  const useHistoryItem = (item: { businessType: string; location: string }) => {
    setBusinessType(item.businessType)
    setLocation(item.location)
    setShowHistory(false)
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <Image src="/zyris-logo.webp" alt="Zyris" width={200} height={67} className="h-12 w-auto" priority />

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
              <span className="sr-only">Notifications</span>
            </Button>
            <UserDropdown userName="Sarah Johnson" userEmail="sarah@zyris.com" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 pt-24">
        {isComplete ? (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <LeadSearchComplete />
            <div className="mt-8 w-full max-w-sm space-y-4">
              <Button className="w-full h-14 rounded-xl font-medium text-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300 text-white">
                <span className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  View Leads
                </span>
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full h-14 rounded-xl font-medium text-lg border-gray-200 hover:bg-gray-50 hover:text-pink-500 transition-colors duration-300"
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
              <CardHeader className="pb-4 flex flex-col items-center px-8 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-pink-500 text-white p-3 rounded-lg shadow-lg shadow-pink-500/20">
                    <Search className="h-9 w-9" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">LeadDesk</h1>
                </div>
                <div className="w-full flex flex-row items-center justify-between">
                  <div>
                    {isSubmitted && !isFormExpanded && (
                      <CardDescription className="text-base font-medium">
                        <span className="text-pink-500">{businessType}</span> in{" "}
                        <span className="text-pink-500">{location}</span>
                      </CardDescription>
                    )}
                  </div>
                  {isSubmitted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleForm}
                      className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {isFormExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      <span className="sr-only">{isFormExpanded ? "Collapse form" : "Expand form"}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isFormExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="businessType" className="text-base font-medium text-gray-700">
                            Business Type
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                  <HelpCircle className="h-4 w-4 text-gray-400" />
                                  <span className="sr-only">Business Type Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Enter any business category like "Dentist", "Coffee Shop", "Plumber", etc.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {businessType && (
                          <button
                            type="button"
                            onClick={clearBusinessType}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div
                        className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                          businessTypeFocused
                            ? "ring-2 ring-pink-500 shadow-md shadow-pink-500/10"
                            : "ring-1 ring-gray-200 hover:ring-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                            businessTypeFocused ? "opacity-100" : ""
                          }`}
                          style={{ pointerEvents: "none" }}
                        ></div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pink-500 transition-colors duration-300 pointer-events-none">
                          <Search className={`h-6 w-6 ${businessTypeFocused ? "text-pink-500" : ""}`} />
                        </div>
                        <Input
                          id="businessType"
                          placeholder=""
                          className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 relative z-10"
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          onFocus={() => setBusinessTypeFocused(true)}
                          onBlur={() => setBusinessTypeFocused(false)}
                          disabled={isSubmitted}
                        />
                        {businessType && (
                          <button
                            type="button"
                            onClick={clearBusinessType}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                          >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Clear business type</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="location" className="text-base font-medium text-gray-700">
                          Location
                        </Label>
                        {location && (
                          <button
                            type="button"
                            onClick={clearLocation}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div
                        className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                          locationFocused
                            ? "ring-2 ring-pink-500 shadow-md shadow-pink-500/10"
                            : "ring-1 ring-gray-200 hover:ring-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                            locationFocused ? "opacity-100" : ""
                          }`}
                          style={{ pointerEvents: "none" }}
                        ></div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pink-500 transition-colors duration-300 pointer-events-none">
                          <MapPin className={`h-6 w-6 ${locationFocused ? "text-pink-500" : ""}`} />
                        </div>
                        <Input
                          id="location"
                          placeholder=""
                          className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 relative z-10"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          onFocus={() => setLocationFocused(true)}
                          onBlur={() => setLocationFocused(false)}
                          disabled={isSubmitted}
                        />
                        {location && (
                          <button
                            type="button"
                            onClick={clearLocation}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                          >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Clear location</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Or divider */}
                    <div className="relative flex items-center justify-center my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-gray-500 bg-white">or</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="url" className="text-base font-medium text-gray-700">
                          Website URL
                        </Label>
                        {url && (
                          <button
                            type="button"
                            onClick={clearUrl}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div
                        className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                          urlFocused
                            ? "ring-2 ring-pink-500 shadow-md shadow-pink-500/10"
                            : "ring-1 ring-gray-200 hover:ring-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                            urlFocused ? "opacity-100" : ""
                          }`}
                          style={{ pointerEvents: "none" }}
                        ></div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pink-500 transition-colors duration-300 pointer-events-none">
                          <Globe className={`h-6 w-6 ${urlFocused ? "text-pink-500" : ""}`} />
                        </div>
                        <Input
                          id="url"
                          placeholder=""
                          className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 relative z-10"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          onFocus={() => setUrlFocused(true)}
                          onBlur={() => setUrlFocused(false)}
                          disabled={isSubmitted}
                        />
                        {url && (
                          <button
                            type="button"
                            onClick={clearUrl}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                          >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Clear URL</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {searchHistory.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={toggleHistory}
                            className="text-sm text-gray-500 hover:text-pink-500 transition-colors flex items-center gap-1"
                          >
                            {showHistory ? "Hide recent searches" : "Show recent searches"}
                            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>

                        {showHistory && (
                          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                            {searchHistory.map((item, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleHistoryItemClick(item)}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Search className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-700">
                                  {item.businessType} in {item.location}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className={`w-full h-14 mt-6 rounded-xl font-medium text-lg relative overflow-hidden group ${
                        ((!businessType || !location) && !url) || isSubmitted
                          ? "opacity-70 cursor-not-allowed"
                          : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300"
                      }`}
                      disabled={((!businessType || !location) && !url) || isSubmitted}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Find Leads
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Button>
                  </form>
                </CardContent>
              </div>

              {isSubmitted && (
                <CardFooter
                  className={`border-t py-4 px-8 transition-all duration-300 ${
                    isFormExpanded ? "opacity-0 max-h-0 py-0 overflow-hidden" : "opacity-100 max-h-24"
                  }`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-pink-500 transition-colors duration-300 text-base"
                    onClick={resetForm}
                  >
                    New Search
                  </Button>
                </CardFooter>
              )}
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
  )
}
