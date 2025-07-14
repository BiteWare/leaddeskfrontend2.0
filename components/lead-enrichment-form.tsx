"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Users, Building2, Mail, Phone, Globe, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import { useUsers, usePracticeScrapes } from "@/hooks"
import { buildFullAddress, buildInputAddress, isValidFreshScrape } from "@/utils/practice-utils"

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
    // Check file size (10MB limit for Excel)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
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
    const error = validateFile(file)
    if (error) {
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
      if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        csvFile = new File([csv], file.name.replace(/\.(xls|xlsx)$/i, '.csv'), { type: 'text/csv' })
      }
      // Parse CSV to rows and store in state
      const text = await csvFile.text()
      // Use the same parseCSV as in the enrichment page
      // We'll import it here
      const { parseCSV } = await import("@/utils/csv-parser")
      const parsedCSV = parseCSV(text)
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
        error: "Failed to upload file. Please try again."
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
      {/* Upload Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Leads</h2>
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
                    <p className="text-xs text-gray-500">{formatFileSize(fileUpload.file.size)}</p>
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
                    {isDragOver ? "Drop your CSV file here" : "Drag and drop your CSV file here"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse (CSV, XLS, XLSX)</p>
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

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>
          <div className="space-y-4">
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

          <Button 
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
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