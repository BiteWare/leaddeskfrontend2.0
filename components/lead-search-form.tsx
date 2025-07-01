"use client"

import type React from "react"
import { useState } from "react"
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  HelpCircle,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardDescription, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LeadSearchFormProps {
  businessType: string
  setBusinessType: (value: string) => void
  location: string
  setLocation: (value: string) => void
  url: string
  setUrl: (value: string) => void
  isSubmitted: boolean
  isFormExpanded: boolean
  searchHistory: Array<{ businessType: string; location: string }>
  showHistory: boolean
  onToggleForm: () => void
  onToggleHistory: () => void
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
  onHistoryItemClick: (item: { businessType: string; location: string }) => void
}

export default function LeadSearchForm({
  businessType,
  setBusinessType,
  location,
  setLocation,
  url,
  setUrl,
  isSubmitted,
  isFormExpanded,
  searchHistory,
  showHistory,
  onToggleForm,
  onToggleHistory,
  onSubmit,
  onReset,
  onHistoryItemClick,
}: LeadSearchFormProps) {
  const [urlFocused, setUrlFocused] = useState(false)
  const [businessTypeFocused, setBusinessTypeFocused] = useState(false)
  const [locationFocused, setLocationFocused] = useState(false)
  const [isBusinessTypeOpen, setIsBusinessTypeOpen] = useState(false)

  const clearBusinessType = () => {
    setBusinessType("")
  }

  const clearLocation = () => {
    setLocation("")
  }

  const clearUrl = () => {
    setUrl("")
  }

  return (
    <>
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
              onClick={onToggleForm}
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
          <form onSubmit={onSubmit} className="space-y-8">
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
                          Select a dental business type from the dropdown menu.
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
                <Select
                  value={businessType}
                  onValueChange={setBusinessType}
                  onOpenChange={(open) => {
                    setIsBusinessTypeOpen(open)
                    setBusinessTypeFocused(open)
                  }}
                  disabled={isSubmitted}
                >
                  <SelectTrigger className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 focus:ring-0 relative z-10">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pediatric Dentist">Pediatric Dentist</SelectItem>
                    <SelectItem value="Orthodontist">Orthodontist</SelectItem>
                    <SelectItem value="General Dentist">General Dentist</SelectItem>
                    <SelectItem value="Dental Implant Specialist">Dental Implant Specialist</SelectItem>
                    <SelectItem value="Cosmetic Dentist">Cosmetic Dentist</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className={`space-y-2 transition-all duration-300 ${isBusinessTypeOpen ? 'mt-48' : 'mt-8'}`}>
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
                  className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 focus-visible:ring-0 relative z-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setLocationFocused(false)}
                  disabled={isSubmitted}
                  autoComplete="off"
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
                  className="border-0 bg-transparent pl-14 pr-12 py-4 h-14 text-lg text-gray-900 focus-visible:ring-0 relative z-10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  disabled={isSubmitted}
                  autoComplete="off"
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
                    onClick={onToggleHistory}
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
                        onClick={() => onHistoryItemClick(item)}
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
            onClick={onReset}
          >
            New Search
          </Button>
        </CardFooter>
      )}
    </>
  )
} 