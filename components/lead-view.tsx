"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Users, 
  Stethoscope, 
  Building, 
  BarChart3, 
  BookOpenCheck,
  Search,
  X,
  Check,
  Lightbulb,
  Code,
  Copy
} from "lucide-react"

export interface StaffMember {
  name: string
  role: string
  location?: string
  phone?: string
  email?: string
  credentials?: string
}

export interface Location {
  id: string
  name: string
  address: string
  phone: string
  email: string
  manager: string
  staffCount: number
  state: string
}

export interface LeadData {
  practiceName: string
  practiceAddress: string
  practiceWebsite?: string
  practicePhone?: string
  practiceEmail?: string
  practiceSpecialty: string
  numberOfDentists: number
  numberOfHygienists: number
  staff: StaffMember[]
  locations?: Location[]
  specialties?: string[]
  // New fields from scraper_worker_results_json
  resultingUrl?: string
  personInCharge?: {
    name: string
    role: string
    credentials?: string
  }
  worksMultipleLocations?: boolean
  scrapeNotes?: string
  // Raw JSON data
  rawJson?: any
}

interface LeadViewProps {
  leadData: LeadData
}

export default function LeadView({ leadData }: LeadViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [copySuccess, setCopySuccess] = useState(false)

  const {
    practiceName,
    practiceAddress,
    practiceWebsite,
    practicePhone,
    practiceEmail,
    practiceSpecialty,
    numberOfDentists,
    numberOfHygienists,
    staff,
    locations = [],
    specialties = [],
    resultingUrl,
    personInCharge,
    worksMultipleLocations,
    scrapeNotes,
    rawJson
  } = leadData

  // Filter data based on search and filters
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (member.location && member.location.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesState = stateFilter === 'all' || 
                          (member.location && locations.find(loc => loc.name === member.location)?.state === stateFilter)
      const matchesRole = roleFilter === 'all' || member.role.toLowerCase().includes(roleFilter.toLowerCase())
      return matchesSearch && matchesState && matchesRole
    })
  }, [staff, searchTerm, stateFilter, roleFilter, locations])

  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           location.address.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState = stateFilter === 'all' || location.state === stateFilter
      return matchesSearch && matchesState
    })
  }, [locations, searchTerm, stateFilter])

  const hasActiveFilters = searchTerm || stateFilter !== 'all' || roleFilter !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setStateFilter('all')
    setRoleFilter('all')
  }

  const copyToClipboard = async () => {
    if (rawJson) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2))
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="shadow-lg flex-1 flex flex-col">
        {/* Fixed Header */}
        <CardHeader className="pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  {practiceName}
                </CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {practiceSpecialty}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  <span>{locations.length} locations</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{staff.length} staff</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

         {/* Flexible Height Container with Tabs */}
         <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            {/* Tab Navigation - Fixed */}
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locations
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="raw-data" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Raw Data
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filter Bar - Fixed Height */}
            <div className="px-6 py-4 border-b">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, role, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="dentist">Dentist</SelectItem>
                    <SelectItem value="hygienist">Hygienist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Content Area - Fixed Height with proper flex */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">Locations</p>
                              <p className="text-2xl font-bold">{locations.length}</p>
                            </div>
                            <Building className="h-8 w-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">Dentists</p>
                              <p className="text-2xl font-bold">{numberOfDentists}</p>
                            </div>
                            <Stethoscope className="h-8 w-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">Hygienists</p>
                              <p className="text-2xl font-bold">{numberOfHygienists}</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">Specialties</p>
                              <p className="text-2xl font-bold">{specialties.length}</p>
                            </div>
                            <BookOpenCheck className="h-8 w-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Practice Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Practice Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <span className="font-medium text-muted-foreground">Address:</span>
                            <p className="text-foreground mt-1">{practiceAddress}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Website:</span>
                            <p className="mt-1">
                              {practiceWebsite ? (
                                <a 
                                  href={practiceWebsite} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 underline"
                                >
                                  <Globe className="h-4 w-4 inline mr-1" />
                                  {practiceWebsite}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Not available</span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpenCheck className="h-5 w-5" />
                            Specialties
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Scraper Information - Only show if scraper data is available */}
                    {(resultingUrl || personInCharge || worksMultipleLocations !== undefined || scrapeNotes) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Globe className="h-5 w-5" />
                              Source Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {resultingUrl && (
                              <div>
                                <span className="font-medium text-muted-foreground">Source URL:</span>
                                <p className="mt-1">
                                  <a 
                                    href={resultingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 underline text-sm break-all"
                                  >
                                    {resultingUrl}
                                  </a>
                                </p>
                              </div>
                            )}
                            
                            {personInCharge && (
                              <div>
                                <span className="font-medium text-muted-foreground">Person in Charge:</span>
                                <div className="mt-1 text-sm">
                                  <span className="font-medium">{personInCharge.name}</span>
                                  {personInCharge.role && <span className="text-muted-foreground"> • {personInCharge.role}</span>}
                                  {personInCharge.credentials && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {personInCharge.credentials}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {worksMultipleLocations !== undefined && (
                              <div>
                                <span className="font-medium text-muted-foreground">Multiple Locations:</span>
                                <div className="mt-1">
                                  <Badge variant={worksMultipleLocations ? "default" : "secondary"}>
                                    {worksMultipleLocations ? "Yes" : "No"}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {scrapeNotes && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Scrape Notes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {scrapeNotes}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Locations Tab */}
                  <TabsContent value="locations" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Office Locations ({filteredLocations.length})</h3>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Office Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Manager</TableHead>
                            <TableHead>Staff Count</TableHead>
                            <TableHead>State</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLocations.map((location) => (
                            <TableRow key={location.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{location.name}</TableCell>
                              <TableCell>{location.address}</TableCell>
                              <TableCell>
                                <a href={`tel:${location.phone}`} className="text-primary hover:text-primary/80">
                                  {location.phone}
                                </a>
                              </TableCell>
                              <TableCell>{location.manager}</TableCell>
                              <TableCell>{location.staffCount}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{location.state}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                   {/* Staff Tab */}
                   <TabsContent value="staff" className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-lg font-semibold">Staff Directory ({filteredStaff.length})</h3>
                     </div>
                     <div className="border rounded-lg overflow-hidden">
                       <div className="overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead className="min-w-[200px]">Name</TableHead>
                               <TableHead className="min-w-[150px]">Role</TableHead>
                               <TableHead className="min-w-[120px]">Credentials</TableHead>
                               <TableHead className="min-w-[150px]">Location</TableHead>
                               <TableHead className="min-w-[140px]">Phone</TableHead>
                               <TableHead className="min-w-[250px]">Email</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {filteredStaff.map((member, index) => (
                               <TableRow key={index} className="hover:bg-muted/50">
                                 <TableCell className="font-medium">{member.name}</TableCell>
                                 <TableCell>
                                   <Badge variant="outline" className="text-xs">
                                     {member.role}
                                   </Badge>
                                 </TableCell>
                                 <TableCell className="text-sm">
                                   {member.credentials ? (
                                     <span className="text-xs text-muted-foreground">{member.credentials}</span>
                                   ) : (
                                     <span className="text-xs text-muted-foreground/50">N/A</span>
                                   )}
                                 </TableCell>
                                 <TableCell className="text-sm">{member.location || 'N/A'}</TableCell>
                                 <TableCell className="text-sm">
                                   {member.phone ? (
                                     <a href={`tel:${member.phone}`} className="text-primary hover:text-primary/80">
                                       {member.phone}
                                     </a>
                                   ) : 'N/A'}
                                 </TableCell>
                                 <TableCell className="text-sm">
                                   {member.email ? (
                                     <a href={`mailto:${member.email}`} className="text-primary hover:text-primary/80 break-all">
                                       {member.email}
                                     </a>
                                   ) : 'N/A'}
                                 </TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                       </div>
                     </div>
                   </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Main Contact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <span className="font-medium text-muted-foreground">Phone:</span>
                            <p className="mt-1">
                              {practicePhone ? (
                                <a 
                                  href={`tel:${practicePhone}`}
                                  className="text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                  <Phone className="h-4 w-4" />
                                  {practicePhone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Not available</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Email:</span>
                            <p className="mt-1">
                              {practiceEmail ? (
                                <a 
                                  href={`mailto:${practiceEmail}`}
                                  className="text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                  <Mail className="h-4 w-4" />
                                  {practiceEmail}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Not available</span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Office Locations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {locations.map((location) => (
                            <div key={location.id} className="border-l-2 border-primary pl-3">
                              <p className="font-medium">{location.name}</p>
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                              <p className="text-sm">
                                <a href={`tel:${location.phone}`} className="text-primary hover:text-primary/80">
                                  {location.phone}
                                </a>
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Role Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(
                              staff.reduce((acc, member) => {
                                acc[member.role] = (acc[member.role] || 0) + 1
                                return acc
                              }, {} as Record<string, number>)
                            ).map(([role, count]) => {
                              const percentage = ((count / staff.length) * 100).toFixed(1)
                              return (
                                <div key={role} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{role}</span>
                                    <span>{count} ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Multi-Location Staff
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-primary">
                              {staff.filter(member => member.location).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Staff with assigned locations</div>
                            <div className="text-xs text-muted-foreground">
                              {((staff.filter(member => member.location).length / staff.length) * 100).toFixed(1)}% of total staff
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                   {/* Research Tab - Placeholder for future AI reasoning data */}
                   <TabsContent value="research" className="space-y-4">
                     <Card>
                       <CardContent className="text-center py-12">
                         <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                         <p className="text-muted-foreground">
                           AI Research analysis will appear here when available.
                         </p>
                       </CardContent>
                     </Card>
                   </TabsContent>

                   {/* Raw Data Tab */}
                   <TabsContent value="raw-data" className="space-y-4">
                     <Card>
                       <CardHeader>
                         <div className="flex items-center justify-between">
                           <CardTitle className="flex items-center gap-2">
                             <Code className="h-5 w-5" />
                             Raw JSON Data
                           </CardTitle>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={copyToClipboard}
                             className="flex items-center gap-2"
                           >
                             {copySuccess ? (
                               <>
                                 <Check className="h-4 w-4 text-green-600" />
                                 Copied!
                               </>
                             ) : (
                               <>
                                 <Copy className="h-4 w-4" />
                                 Copy to Clipboard
                               </>
                             )}
                           </Button>
                         </div>
                       </CardHeader>
                       <CardContent>
                         {rawJson ? (
                           <div className="relative w-full">
                             <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-y-auto overflow-x-hidden max-h-[600px] text-sm whitespace-pre-wrap break-words w-full">
                               <code className="block w-full">{JSON.stringify(rawJson, null, 2)}</code>
                             </pre>
                           </div>
                         ) : (
                           <div className="text-center py-8 text-muted-foreground">
                             <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                             <p>No raw data available</p>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}