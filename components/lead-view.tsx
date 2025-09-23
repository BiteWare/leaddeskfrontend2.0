"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Globe, Phone, Mail, Users, Stethoscope } from "lucide-react"

export interface StaffMember {
  name: string
  role: string
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
}

interface LeadViewProps {
  leadData: LeadData
}

// Mock data for demonstration
export const mockLeadData: LeadData = {
  practiceName: "Bright Smiles Dental Clinic",
  practiceAddress: "123 Main Street, Suite 200, San Francisco, CA 94105",
  practiceWebsite: "https://brightsmilesdental.com",
  practicePhone: "(555) 123-4567",
  practiceEmail: "info@brightsmilesdental.com",
  practiceSpecialty: "General Dentistry & Orthodontics",
  numberOfDentists: 3,
  numberOfHygienists: 4,
  staff: [
    { name: "Dr. Sarah Johnson", role: "Lead Dentist" },
    { name: "Dr. Michael Chen", role: "Orthodontist" },
    { name: "Dr. Emily Rodriguez", role: "General Dentist" },
    { name: "Lisa Thompson", role: "Hygienist" },
    { name: "Maria Garcia", role: "Hygienist" },
    { name: "Jennifer Lee", role: "Hygienist" },
    { name: "Robert Davis", role: "Hygienist" },
    { name: "Amanda Wilson", role: "Office Manager" },
    { name: "David Brown", role: "Dental Assistant" }
  ]
}

// Additional mock data examples for testing different scenarios
export const mockLeadDataMinimal: LeadData = {
  practiceName: "Family Dental Care",
  practiceAddress: "456 Oak Avenue, Portland, OR 97201",
  practiceWebsite: undefined, // Testing missing website
  practicePhone: "(503) 555-0123",
  practiceEmail: undefined, // Testing missing email
  practiceSpecialty: "Family Dentistry",
  numberOfDentists: 1,
  numberOfHygienists: 2,
  staff: [
    { name: "Dr. James Wilson", role: "Dentist" },
    { name: "Susan Martinez", role: "Hygienist" },
    { name: "Tom Anderson", role: "Hygienist" }
  ]
}

export const mockLeadDataLarge: LeadData = {
  practiceName: "Metropolitan Dental Group",
  practiceAddress: "789 Business Plaza, Suite 500, New York, NY 10001",
  practiceWebsite: "https://metrodental.com",
  practicePhone: "(212) 555-7890",
  practiceEmail: "contact@metrodental.com",
  practiceSpecialty: "Cosmetic & Restorative Dentistry",
  numberOfDentists: 8,
  numberOfHygienists: 12,
  staff: [
    { name: "Dr. Patricia Williams", role: "Chief Dentist" },
    { name: "Dr. Robert Kim", role: "Cosmetic Dentist" },
    { name: "Dr. Lisa Thompson", role: "Orthodontist" },
    { name: "Dr. Mark Johnson", role: "Periodontist" },
    { name: "Dr. Sarah Davis", role: "Endodontist" },
    { name: "Dr. Michael Brown", role: "Oral Surgeon" },
    { name: "Dr. Jennifer Wilson", role: "General Dentist" },
    { name: "Dr. David Miller", role: "General Dentist" },
    { name: "Emily Chen", role: "Senior Hygienist" },
    { name: "Maria Rodriguez", role: "Hygienist" },
    { name: "Jessica Lee", role: "Hygienist" },
    { name: "Amanda Taylor", role: "Hygienist" },
    { name: "Rachel Green", role: "Hygienist" },
    { name: "Samantha White", role: "Hygienist" },
    { name: "Nicole Harris", role: "Hygienist" },
    { name: "Ashley Martin", role: "Hygienist" },
    { name: "Brittany Clark", role: "Hygienist" },
    { name: "Stephanie Lewis", role: "Hygienist" },
    { name: "Danielle Walker", role: "Hygienist" },
    { name: "Courtney Hall", role: "Hygienist" },
    { name: "Megan Allen", role: "Hygienist" },
    { name: "Laura Young", role: "Office Manager" },
    { name: "Jennifer King", role: "Assistant Manager" },
    { name: "Michelle Wright", role: "Dental Assistant" },
    { name: "Kimberly Lopez", role: "Dental Assistant" },
    { name: "Donna Hill", role: "Dental Assistant" },
    { name: "Carol Scott", role: "Dental Assistant" },
    { name: "Ruth Green", role: "Receptionist" },
    { name: "Sharon Adams", role: "Receptionist" }
  ]
}

export default function LeadView({ leadData }: LeadViewProps) {
  const {
    practiceName,
    practiceAddress,
    practiceWebsite,
    practicePhone,
    practiceEmail,
    practiceSpecialty,
    numberOfDentists,
    numberOfHygienists,
    staff
  } = leadData

  const formatValue = (value: string | number | undefined, fallback: string = "Not available") => {
    return value ?? fallback
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Stethoscope className="h-8 w-8" />
            {practiceName}
          </CardTitle>
          <Badge variant="secondary" className="w-fit">
            {practiceSpecialty}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Practice Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Practice Information
              </h3>
              <div className="space-y-3 text-sm">
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
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Practice Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{numberOfDentists}</div>
                  <div className="text-sm text-muted-foreground">Dentists</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{numberOfHygienists}</div>
                  <div className="text-sm text-muted-foreground">Hygienists</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Staff List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Directory ({staff.length} total)
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
