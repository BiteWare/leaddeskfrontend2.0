"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Download, Users, Building2, Mail, Phone, Globe, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import { useUsers, usePracticeScrapes } from "@/hooks"
import { buildFullAddress, buildInputAddress, isValidFreshScrape } from "@/utils/practice-utils"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface LeadEnrichmentFormProps {
  onEnrichLead?: (data: { practiceName?: string; street?: string; city?: string; state?: string }) => void
  onFileUpload?: (file: File) => void
}

interface FileUploadState {
  file: File | null
  isUploading: boolean
  error: string | null
  success: boolean
}

interface CachedDataState {
  found: boolean
  data: any | null
  loading: boolean
}

export default function LeadEnrichmentForm({ onEnrichLead, onFileUpload }: LeadEnrichmentFormProps) {
  const { user } = useUsers()
  const { getPracticeScrape, upsertPracticeScrape } = usePracticeScrapes()
  
  const [practiceName, setPracticeName] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    error: null,
    success: false
  })
  const [parsedFileRows, setParsedFileRows] = useState<any[] | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [cachedData, setCachedData] = useState<CachedDataState>({
    found: false,
    data: null,
    loading: false
  })
  const [isEnriching, setIsEnriching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Allow CSV and Excel files
    const allowedExtensions = [".csv", ".xls", ".xlsx"]
    const fileName = file.name.toLowerCase()
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
      return "Please upload a CSV or Excel file (.csv, .xls, .xlsx)"
    }
    // Check file size (20MB limit for CSV, 10MB for Excel)
    const fileNameLower = file.name.toLowerCase()
    const isCSV = fileNameLower.endsWith('.csv')
    const maxSize = isCSV ? 20 * 1024 * 1024 : 10 * 1024 * 1024 // 20MB for CSV, 10MB for Excel
    if (file.size > maxSize) {
      return `File size must be less than ${isCSV ? '20MB' : '10MB'}`
    }
    return null
  }

  /**
   * Check for cached practice data before enrichment
   */
  const checkCachedData = useCallback(async () => {
    if (!practiceName || (!street && !city && !state)) {
      setCachedData({ found: false, data: null, loading: false })
      return
    }

    setCachedData(prev => ({ ...prev, loading: true }))
    
    try {
      const inputAddress = buildInputAddress(street, city, state)
      const cachedScrape = await getPracticeScrape(practiceName, inputAddress)
      
      if (isValidFreshScrape(cachedScrape)) {
        setCachedData({
          found: true,
          data: cachedScrape?.scrape_data,
          loading: false
        })
        return cachedScrape
      } else {
        setCachedData({ found: false, data: null, loading: false })
        return null
      }
    } catch (error) {
      console.error('Error checking cached data:', error)
      setCachedData({ found: false, data: null, loading: false })
      return null
    }
  }, [practiceName, street, city, state, getPracticeScrape])

  /**
   * Save enrichment results to cache
   */
  const saveToCache = useCallback(async (scrapedData: any) => {
    if (!user?.id || !practiceName) return

    try {
      const inputAddress = buildInputAddress(street, city, state)
      await upsertPracticeScrape({
        user_id: user.id,
        input_name: practiceName,
        input_street: inputAddress,
        input_city: city || '',
        input_state: state || '',
        scrape_datetime: new Date().toISOString(),
        scrape_data: scrapedData,
        serp_url: '',
        gm_name: '',
        gm_street: '',
        gm_city: '',
        gm_state: '',
        gm_zip: '',
        gm_phone: '',
        gm_url: ''
      })
    } catch (error) {
      console.error('Error saving to cache:', error)
      // Don't throw - caching failure shouldn't break the main flow
    }
  }, [user?.id, practiceName, street, city, state, upsertPracticeScrape])

  const handleFileSelect = useCallback(async (file: File) => {
    console.log('File selected:', file.name, file.type, file.size) // Debug log
    const error = validateFile(file)
    if (error) {
      console.log('File validation error:', error) // Debug log
      setFileUpload({
        file: null,
        isUploading: false,
        error,
        success: false
      })
      setParsedFileRows(null)
      return
    }
    setFileUpload({
      file,
      isUploading: true,
      error: null,
      success: false
    })
    try {
      let csvFile = file
      const fileName = file.name.toLowerCase()
      console.log('Processing file:', fileName) // Debug log
      
      if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        console.log('Converting Excel file to CSV') // Debug log
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        csvFile = new File([csv], file.name.replace(/\.(xls|xlsx)$/i, '.csv'), { type: 'text/csv' })
      } else {
        console.log('Processing CSV file directly') // Debug log
      }
      
      // Parse CSV to rows and store in state
      const text = await csvFile.text()
      console.log('CSV text length:', text.length) // Debug log
      
      // Use the same parseCSV as in the enrichment page
      // We'll import it here
      const { parseCSV, validateLeadEnrichmentCSV } = await import("@/utils/csv-parser")
      const parsedCSV = parseCSV(text)
      console.log('Parsed CSV:', parsedCSV.headers, parsedCSV.rows.length) // Debug log
      
      // File format and content validation using the new utility function
      const validation = validateLeadEnrichmentCSV(parsedCSV)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '))
      }
      
      setParsedFileRows(parsedCSV.rows)
      
      if (onFileUpload) {
        await onFileUpload(csvFile)
      }
      setFileUpload(prev => ({
        ...prev,
        isUploading: false,
        success: true
      }))
    } catch (error) {
      setFileUpload(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : "Failed to upload file. Please try again."
      }))
      setParsedFileRows(null)
    }
  }, [onFileUpload, user?.id])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('File input change:', file) // Debug log
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleRemoveFile = () => {
    setFileUpload({
      file: null,
      isUploading: false,
      error: null,
      success: false
    })
    setParsedFileRows(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleChooseFileClick = () => {
    console.log('Choose file button clicked') // Debug log
    fileInputRef.current?.click()
  }

  const handleEnrichLead = async () => {
    // Check if user is authenticated
    if (!user?.id) {
      console.error('User not authenticated')
      return
    }

    setIsEnriching(true)
    
    try {
      // Check for cached data first
      const cachedScrape = await checkCachedData()
      
      if (cachedScrape) {
        // Use cached data
        console.log('Using cached data:', cachedScrape.scrape_data)
        // You could display the cached data here or pass it to a callback
        return
      }

      // If a file was uploaded and parsed, POST its rows to the API
      if (parsedFileRows && parsedFileRows.length > 0) {
        try {
          // Get the Supabase access token
          let accessToken = undefined;
          if (user) {
            const { data: { session } } = await import('@/utils/supabase-client').then(m => m.supabase.auth.getSession());
            accessToken = session?.access_token;
          }
          const response = await fetch("/api/submit-leaddesk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
            },
            credentials: "include", // Send cookies for auth
            body: JSON.stringify({ 
              filename: fileUpload.file?.name || 'uploaded_file.csv',
              rows: parsedFileRows 
            })
          })
          if (!response.ok) throw new Error("API request failed")
          
          const result = await response.json()
          
          // Save results to cache
          await saveToCache(result)
          
          // Optionally, show a success message or handle response
        } catch (err) {
          // Optionally, show an error message
          console.error('Error processing file:', err)
        }
      }
      // Also call the manual enrich handler if present
      if (onEnrichLead) {
        onEnrichLead({ practiceName, street, city, state })
      }
    } catch (error) {
      console.error('Error during enrichment:', error)
    } finally {
      setIsEnriching(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Form Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-pink-500 text-white p-3 rounded-lg shadow-lg shadow-pink-500/20">
            <Users className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Enrichment</h1>
        </div>
      </div>
      {/* File Requirements at the top */}
      <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-pink-700 mb-1">File requirements:</p>
          <ul className="text-sm text-pink-800 list-disc ml-5 mb-1">
            <li>Supported formats: <span className="font-medium">CSV, XLS, XLSX</span></li>
            <li>Must include columns: <span className="font-medium">Location Name, Ship Street, Ship City, Ship State</span></li>
            <li>Maximum <span className="font-medium">20 rows</span> per upload</li>
            <li>Maximum file size: <span className="font-medium">20MB for CSV, 10MB for Excel</span></li>
          </ul>
        </div>
        <a
          href="/enrichment-template.xlsx"
          download
          aria-label="Download enrichment template"
          title="Download enrichment template"
          className="ml-4 p-2 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 hover:text-pink-800 transition-colors border border-pink-200 shadow-sm"
        >
          <Download className="h-5 w-5" />
        </a>
      </div>

      {/* Upload Section (no header) */}
      <div className="space-y-6">
        <div>
          <div className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragOver 
                  ? "border-pink-400 bg-pink-50" 
                  : fileUpload.file 
                    ? "border-green-300 bg-green-50" 
                    : "border-gray-300 hover:border-pink-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {fileUpload.isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 text-pink-500 mx-auto animate-spin" />
                  <p className="text-gray-600">Uploading file...</p>
                </div>
              ) : fileUpload.success && fileUpload.file ? (
                <div className="space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-green-600 font-medium mb-2">File uploaded successfully!</p>
                    <p className="text-sm text-gray-600 mb-2">{fileUpload.file.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{formatFileSize(fileUpload.file.size)}</p>
                    {parsedFileRows && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ {parsedFileRows.length} row{parsedFileRows.length !== 1 ? 's' : ''} ready for enrichment
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove File
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${
                    isDragOver ? "text-pink-500" : "text-gray-400"
                  }`} />
                  <p className="text-gray-600 mb-2">
                    {isDragOver ? "Drop your lead file here" : "Drag and drop your lead file here"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse (CSV, XLS, XLSX)</p>
                  <p className="text-xs text-gray-400 mb-4">Use the template above for correct formatting</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    className="bg-white cursor-pointer hover:bg-gray-50"
                    onClick={handleChooseFileClick}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>

            {fileUpload.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileUpload.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Manual Entry Accordion */}
        <div className="mt-2">
          <Accordion type="single" collapsible className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
            <AccordionItem value="manual-entry">
              <AccordionTrigger className="px-4 py-3 font-semibold text-gray-800">Manual Entry</AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="practiceName" className="text-sm font-medium text-gray-700">
                    Practice Name
                  </Label>
                  <Input 
                    id="practiceName" 
                    placeholder="Enter practice name to enrich"
                    className="mt-1"
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                      Street Address
                    </Label>
                    <Input 
                      id="street" 
                      placeholder="Enter street address"
                      className="mt-1"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <Input 
                      id="city" 
                      placeholder="Enter city"
                      className="mt-1"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State
                    </Label>
                    <Input 
                      id="state" 
                      placeholder="Enter state"
                      className="mt-1"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>

                {/* Cache Status Display */}
                {cachedData.loading && (
                  <Alert className="mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Checking for cached data...</AlertDescription>
                  </Alert>
                )}

                {cachedData.found && (
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Found fresh cached data for this practice. Using cached results instead of re-scraping.
                    </AlertDescription>
                  </Alert>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Enrich Lead Button at the bottom of the form */}
        <div className="flex justify-center mt-6">
          <Button 
            className="w-1/2 max-w-xs rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            onClick={handleEnrichLead}
            disabled={
              isEnriching ||
              !user?.id ||
              !(
                (parsedFileRows && parsedFileRows.length > 0) ||
                practiceName ||
                street ||
                city ||
                state
              )
            }
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enriching...
              </>
            ) : (
              'Enrich Lead'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 