"use client"

import type React from "react"
import { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebarCustom } from "@/components/app-sidebar-custom"
import { AuthGuard } from "@/components/auth-guard"
import Searchbar from "@/components/Searchbar"
import LeadView, { mockLeadData, type LeadData } from "@/components/lead-view"
import { MorphingLoader } from "@/components/morphing-loader"

export default function LeadDeskForm() {
  const [searchResults, setSearchResults] = useState<LeadData | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // For now, always return mock data regardless of query
    // In the future, this would make an actual API call
    setSearchResults(mockLeadData)
    setIsSearching(false)
  }

  const handleStartOver = () => {
    setSearchResults(null)
    setIsSearching(false)
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebarCustom />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
            {/* Header Bar */}
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
              <div className="w-full flex flex-col items-center justify-center -mt-46">
                <Searchbar 
                  onSearch={handleSearch} 
                  hasResults={!!searchResults} 
                  onStartOver={handleStartOver}
                />
                
                {isSearching && (
                  <div className="mt-8 text-center">
                    <MorphingLoader className="mb-6" />
                    <p className="text-sm text-muted-foreground">Searching for practices...</p>
                  </div>
                )}
                
                {searchResults && !isSearching && (
                  <div className="w-full mt-8">
                    <LeadView leadData={searchResults} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}