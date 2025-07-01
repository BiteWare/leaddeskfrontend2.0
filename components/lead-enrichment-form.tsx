"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Users, Building2, Mail, Phone, Globe, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LeadEnrichmentFormProps {
  onEnrichLead?: (data: { email?: string; company?: string; website?: string }) => void
  onFileUpload?: (file: File) => void
}

interface FileUploadState {
  file: File | null
  isUploading: boolean
  error: string | null
  success: boolean
}

export default function LeadEnrichmentForm({ onEnrichLead, onFileUpload }: LeadEnrichmentFormProps) {
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [website, setWebsite] = useState("")
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    error: null,
    success: false
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return "Please upload a CSV file"
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return "File size must be less than 5MB"
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
      return
    }

    setFileUpload({
      file,
      isUploading: true,
      error: null,
      success: false
    })

    try {
      if (onFileUpload) {
        await onFileUpload(file)
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
    }
  }, [onFileUpload])

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleChooseFileClick = () => {
    console.log('Choose file button clicked') // Debug log
    fileInputRef.current?.click()
  }

  const handleEnrichLead = () => {
    if (onEnrichLead) {
      onEnrichLead({ email, company, website })
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
    <div className="grid gap-8 md:grid-cols-2">
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
                  <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
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
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Supported Formats</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV files with email addresses</li>
                <li>• CSV files with company names</li>
                <li>• CSV files with website URLs</li>
                <li>• Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input 
                id="email" 
                placeholder="Enter email address to enrich"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                Company Name
              </Label>
              <Input 
                id="company" 
                placeholder="Enter company name to enrich"
                className="mt-1"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                Website URL
              </Label>
              <Input 
                id="website" 
                placeholder="Enter website URL to enrich"
                className="mt-1"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
              onClick={handleEnrichLead}
              disabled={!email && !company && !website}
            >
              Enrich Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrichment Preview</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Acme Corporation</p>
                  <p className="text-sm text-gray-500">Technology • 50-200 employees</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">john.doe@acme.com</p>
                  <p className="text-sm text-gray-500">Verified email address</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-500">Direct line</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">acme.com</p>
                  <p className="text-sm text-gray-500">Company website</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrichment Features</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <FileText className="h-5 w-5 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Contact Information</p>
                <p className="text-sm text-gray-500">Email, phone, and direct dial numbers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Users className="h-5 w-5 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Social Profiles</p>
                <p className="text-sm text-gray-500">LinkedIn, Twitter, and other social media</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Building2 className="h-5 w-5 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Company Details</p>
                <p className="text-sm text-gray-500">Industry, size, location, and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 