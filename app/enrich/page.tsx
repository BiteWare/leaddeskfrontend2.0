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
      
      // Validate headers
      const headerValidation = validateCSVHeaders(parsedCSV.headers)
      
      if (!headerValidation.isValid) {
        toast({
          title: "Invalid CSV format",
          description: `Missing required columns: ${headerValidation.missingColumns.join(', ')}. Please include email, company, or website columns.`,
          variant: "destructive",
        })
        throw new Error("Invalid CSV format")
      }
      
      // Extract lead data
      const leads = parsedCSV.rows.map(row => extractLeadData(row))
      const validLeads = leads.filter(lead => lead.email || lead.company || lead.website)
      
      if (validLeads.length === 0) {
        toast({
          title: "No valid leads found",
          description: "The CSV file doesn't contain any valid email addresses, company names, or website URLs.",
          variant: "destructive",
        })
        throw new Error("No valid leads found")
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "File uploaded successfully!",
        description: `Found ${validLeads.length} leads for enrichment. Processing will begin shortly.`,
      })
      
      // Here you would typically send the leads to your enrichment API
      console.log('Processing leads:', validLeads)
      
    } catch (error) {
      if (error instanceof Error && error.message !== "Invalid CSV format" && error.message !== "No valid leads found") {
        toast({
          title: "Upload failed",
          description: "There was an error processing your file. Please try again.",
          variant: "destructive",
        })
      }
      throw error // Re-throw to let the component handle the error state
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnrichLead = async (data: { email?: string; company?: string; website?: string }) => {
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