"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Users, Building2, Mail, Phone, Globe, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import { useUsers, useCreateBatchRun, useUpdateBatchRun } from "@/hooks"

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

export default function LeadEnrichmentForm({ onEnrichLead, onFileUpload }: LeadEnrichmentFormProps) {
  const { user } = useUsers()
  const { createBatchRun } = useCreateBatchRun()
  const { updateBatchRun } = useUpdateBatchRun()
  
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
  const [currentBatchRunId, setCurrentBatchRunId] = useState<string | null>(null)
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
      // Create batch run record if user is authenticated
      let batchRunId: string | null = null
      if (user?.id) {
        const batchRun = await createBatchRun(user.id, file.name, {
          fileSize: file.size,
          fileType: file.type,
          rowCount: null // Will be updated after parsing
        })
        batchRunId = batchRun?.id || null
        setCurrentBatchRunId(batchRunId)
      }

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
      
      // Update batch run with row count if it exists
      if (batchRunId) {
        await updateBatchRun(batchRunId, {
          meta: {
            fileSize: file.size,
            fileType: file.type,
            rowCount: parsedCSV.rows.length,
            parsedAt: new Date().toISOString()
          }
        })
      }
      
      if (onFileUpload) {
        await onFileUpload(csvFile)
      }
      setFileUpload(prev => ({
        ...prev,
        isUploading: false,
        success: true
      }))
    } catch (error) {
      // Update batch run with error if it exists
      if (currentBatchRunId) {
        await updateBatchRun(currentBatchRunId, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Failed to process file',
          finished_at: new Date().toISOString()
        })
      }
      
      setFileUpload(prev => ({
        ...prev,
        isUploading: false,
        error: "Failed to upload file. Please try again."
      }))
      setParsedFileRows(null)
    }
  }, [onFileUpload, user?.id, createBatchRun, updateBatchRun, currentBatchRunId])

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
    setCurrentBatchRunId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleChooseFileClick = () => {
    console.log('Choose file button clicked') // Debug log
    fileInputRef.current?.click()
  }

  const handleEnrichLead = async () => {
    // Update batch run status to processing if it exists
    if (currentBatchRunId) {
      await updateBatchRun(currentBatchRunId, {
        status: 'processing',
        started_at: new Date().toISOString()
      })
    }

    // If a file was uploaded and parsed, POST its rows to the API
    if (parsedFileRows && parsedFileRows.length > 0) {
      try {
        const response = await fetch("/api/submit-leaddesk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: parsedFileRows })
        })
        if (!response.ok) throw new Error("API request failed")
        
        // Update batch run status to completed if successful
        if (currentBatchRunId) {
          await updateBatchRun(currentBatchRunId, {
            status: 'completed',
            finished_at: new Date().toISOString(),
            result_url: null // Could be updated with actual result URL if available
          })
        }
        // Optionally, show a success message or handle response
      } catch (err) {
        // Update batch run status to failed if there's an error
        if (currentBatchRunId) {
          await updateBatchRun(currentBatchRunId, {
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'API request failed',
            finished_at: new Date().toISOString()
          })
        }
        // Optionally, show an error message
      }
    }
    // Also call the manual enrich handler if present
    if (onEnrichLead) {
      onEnrichLead({ practiceName, street, city, state })
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
          <Button 
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            onClick={handleEnrichLead}
            disabled={
              !(
                (parsedFileRows && parsedFileRows.length > 0) ||
                practiceName ||
                street ||
                city ||
                state
              )
            }
          >
            Enrich Lead
          </Button>
        </div>
      </div>
    </div>
  )
} 