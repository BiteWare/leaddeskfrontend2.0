"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/appheader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Footer from "@/components/footer"
import LeadEnrichmentForm from "@/components/lead-enrichment-form"
import { useToast } from "@/hooks/use-toast"
import { parseCSV, validateCSVHeaders, extractLeadData } from "@/utils/csv-parser"

export default function EnrichPage() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    
    try {
      // Read the file
      const text = await file.text()
      
      // Parse CSV
      const parsedCSV = parseCSV(text)
      
      // Remove header validation: allow any file
      // Only check if there are any rows
      if (!parsedCSV.rows || parsedCSV.rows.length === 0) {
        toast({
          title: "No data found",
          description: "The file does not contain any data rows.",
          variant: "destructive",
        })
        throw new Error("No data found")
      }
      
      // Extract all rows as-is (no filtering)
      // Optionally, you can log or process them here
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "File uploaded successfully!",
        description: `Found ${parsedCSV.rows.length} rows for enrichment. Processing will begin shortly.`,
      })
      
      // Here you would typically send the rows to your enrichment API
      console.log('Processing rows:', parsedCSV.rows)
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to let the component handle the error state
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnrichLead = async (data: { practiceName?: string; street?: string; city?: string; state?: string }) => {
    setIsProcessing(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Here you would typically send the data to your enrichment API
      console.log('Enriching lead:', data)
      
      toast({
        title: "Lead enrichment started",
        description: "We're gathering additional information for your lead.",
      })
      
    } catch (error) {
      toast({
        title: "Enrichment failed",
        description: "There was an error enriching your lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <AppHeader />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 pt-24">
          <Card className="w-full max-w-4xl border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 flex flex-col items-center px-8 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-500 text-white p-3 rounded-lg shadow-lg shadow-pink-500/20">
                  <Users className="h-9 w-9" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Lead Enrichment</h1>
              </div>
              <p className="text-gray-600 text-center max-w-2xl">
                Enhance your existing leads with additional contact information, social media profiles, 
                and business details to improve your outreach campaigns.
              </p>
            </CardHeader>

            <CardContent className="p-8">
              <LeadEnrichmentForm 
                onEnrichLead={handleEnrichLead}
                onFileUpload={handleFileUpload}
              />
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    </AuthGuard>
  )
} 