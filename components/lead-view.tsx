"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Copy,
} from "lucide-react";
import { getCohortColor } from "@/utils/cohort-loader";

export interface StaffMember {
  name: string;
  role: string;
  location?: string;
  credentials?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  staffCount: number;
  state: string;
}

export interface LeadData {
  practiceName: string;
  practiceAddress: string;
  practiceWebsite?: string;
  practicePhone?: string;
  practiceEmail?: string;
  practiceSpecialty: string;
  numberOfDentists: number;
  numberOfHygienists: number;
  staff: StaffMember[];
  locations?: Location[];
  specialties?: string[];
  // New fields from scraper_worker_results_json
  resultingUrl?: string;
  personInCharge?: {
    name: string;
    role: string;
    credentials?: string;
  };
  worksMultipleLocations?: boolean;
  scrapeNotes?: string;
  // Cohort classification
  cohort?: string;
  excluded?: boolean;
  // Original user input
  originalInput?: string;
  // Raw JSON data
  rawJson?: any;
}

interface LeadViewProps {
  leadData: LeadData;
}

/**
 * Returns Tailwind color classes for cohort badge based on cohort type
 * Note: This function now uses getCohortColor from cohort-loader.ts
 */
function getCohortColorClasses(cohort: string | undefined): string {
  if (!cohort) return "bg-slate-500/10 text-slate-700 border-slate-300";

  const color = getCohortColor(cohort);

  // Map color name to Tailwind classes
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-300",
    green: "bg-green-500/10 text-green-700 border-green-300",
    gray: "bg-gray-500/10 text-gray-700 border-gray-300",
    red: "bg-red-500/10 text-red-700 border-red-300",
    yellow: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
    purple: "bg-purple-500/10 text-purple-700 border-purple-300",
    slate: "bg-slate-500/10 text-slate-700 border-slate-300",
  };

  return colorMap[color] || "bg-slate-500/10 text-slate-700 border-slate-300";
}

/**
 * Determines practice type based on specialties
 * Returns "General Practice" if general dentistry keywords found, otherwise "Specialty Practice"
 */
function getPracticeType(specialties: string[]): string {
  if (!specialties || specialties.length === 0) return "Not Available";

  const generalKeywords = [
    "general dentistry",
    "general",
    "family dentistry",
    "comprehensive care",
    "preventive care",
  ];

  const hasGeneral = specialties.some((specialty) =>
    generalKeywords.some((keyword) =>
      specialty.toLowerCase().includes(keyword),
    ),
  );

  return hasGeneral ? "General Practice" : "Specialty Practice";
}

/**
 * Extracts primary specialty from the specialties list
 * Returns the first specialty that isn't "general dentistry" or similar
 */
function getPrimarySpecialty(specialties: string[]): string {
  if (!specialties || specialties.length === 0) return "Not Available";

  const generalKeywords = [
    "general dentistry",
    "general",
    "family dentistry",
    "comprehensive",
    "preventive",
  ];

  // Find first non-general specialty
  const primarySpecialty = specialties.find(
    (specialty) =>
      !generalKeywords.some((keyword) =>
        specialty.toLowerCase().includes(keyword),
      ),
  );

  // If no specialty found or all are general, return first one
  return primarySpecialty || specialties[0] || "Not Available";
}

export default function LeadView({ leadData }: LeadViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

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
    cohort,
    originalInput,
    rawJson,
  } = leadData;

  // Filter data based on search and filters
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.location &&
          member.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesState =
        stateFilter === "all" ||
        (member.location &&
          locations.find((loc) => loc.name === member.location)?.state ===
            stateFilter);
      const matchesRole =
        roleFilter === "all" ||
        member.role.toLowerCase().includes(roleFilter.toLowerCase());
      return matchesSearch && matchesState && matchesRole;
    });
  }, [staff, searchTerm, stateFilter, roleFilter, locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState =
        stateFilter === "all" || location.state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [locations, searchTerm, stateFilter]);

  const hasActiveFilters =
    searchTerm || stateFilter !== "all" || roleFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStateFilter("all");
    setRoleFilter("all");
  };

  const copyToClipboard = async () => {
    if (rawJson) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

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
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{practiceSpecialty}</Badge>
                  {cohort && (
                    <Badge
                      variant="outline"
                      className={getCohortColorClasses(cohort)}
                      title="Automatically classified cohort"
                    >
                      {cohort}
                    </Badge>
                  )}
                </div>
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
          <Tabs defaultValue="practice-info" className="flex-1 flex flex-col">
            {/* Tab Navigation - Fixed */}
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger
                  value="practice-info"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Practice Info
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff
                </TabsTrigger>
                <TabsTrigger
                  value="locations"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Locations
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="raw-data"
                  className="flex items-center gap-2"
                >
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
                    {/* Practice Info Tab */}
                    <TabsContent value="practice-info" className="space-y-6">
                      {/* 2-Column Grid Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                          {/* Practice Information Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Practice Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Practice Name:
                                </span>
                                <p className="text-foreground mt-1 font-semibold">
                                  {practiceName}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Address:
                                </span>
                                <p className="text-foreground mt-1">
                                  {practiceAddress}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Phone:
                                </span>
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
                                    <span className="text-muted-foreground">
                                      Not available
                                    </span>
                                  )}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Practice URL:
                                </span>
                                <p className="mt-1">
                                  {practiceWebsite ? (
                                    <a
                                      href={practiceWebsite}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80 underline flex items-center gap-1 break-all"
                                    >
                                      <Globe className="h-4 w-4 shrink-0" />
                                      <span className="break-all">
                                        {practiceWebsite}
                                      </span>
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Not available
                                    </span>
                                  )}
                                </p>
                              </div>
                              {practiceEmail && (
                                <>
                                  <Separator />
                                  <div>
                                    <span className="font-medium text-muted-foreground">
                                      Practice Email:
                                    </span>
                                    <p className="mt-1">
                                      <a
                                        href={`mailto:${practiceEmail}`}
                                        className="text-primary hover:text-primary/80 flex items-center gap-1 break-all"
                                      >
                                        <Mail className="h-4 w-4 shrink-0" />
                                        <span className="break-all">
                                          {practiceEmail}
                                        </span>
                                      </a>
                                    </p>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>

                          {/* Practice Details Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5" />
                                Practice Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Practice Type:
                                </span>
                                <p className="text-foreground mt-1">
                                  <Badge variant="secondary">
                                    {getPracticeType(specialties)}
                                  </Badge>
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Primary Specialty:
                                </span>
                                <p className="text-foreground mt-1">
                                  <Badge variant="outline">
                                    {getPrimarySpecialty(specialties)}
                                  </Badge>
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Services Offered:
                                </span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {specialties.length > 0 ? (
                                    specialties.map((specialty, index) => (
                                      <Badge key={index} variant="secondary">
                                        {specialty}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      Not available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          {/* Leadership & Team Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Leadership & Team
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {personInCharge && (
                                <>
                                  <div>
                                    <span className="font-medium text-muted-foreground">
                                      Person in Charge:
                                    </span>
                                    <div className="mt-1">
                                      <p className="font-semibold text-foreground">
                                        {personInCharge.name}
                                      </p>
                                      {personInCharge.role && (
                                        <p className="text-sm text-muted-foreground">
                                          {personInCharge.role}
                                          {personInCharge.credentials &&
                                            ` (${personInCharge.credentials})`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Separator />
                                </>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="font-medium text-muted-foreground text-sm">
                                    Dentists:
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Stethoscope className="h-5 w-5 text-green-600" />
                                    <span className="text-2xl font-bold text-foreground">
                                      {numberOfDentists}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground text-sm">
                                    Hygienists:
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Users className="h-5 w-5 text-purple-600" />
                                    <span className="text-2xl font-bold text-foreground">
                                      {numberOfHygienists}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Number of Related Locations:
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-5 w-5 text-blue-600" />
                                  <span className="text-2xl font-bold text-foreground">
                                    {locations.length}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Additional Information Card */}
                          {scrapeNotes && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Lightbulb className="h-5 w-5" />
                                  Additional Information
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
                      </div>
                    </TabsContent>

                    {/* Locations Tab */}
                    <TabsContent value="locations" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Office Locations ({filteredLocations.length})
                        </h3>
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
                              <TableRow
                                key={location.id}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  {location.name}
                                </TableCell>
                                <TableCell>{location.address}</TableCell>
                                <TableCell>
                                  {location.phone ? (
                                    <a
                                      href={`tel:${location.phone}`}
                                      className="text-primary hover:text-primary/80"
                                    >
                                      {location.phone}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      N/A
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{location.manager}</TableCell>
                                <TableCell>{location.staffCount}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {location.state}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Staff Directory Tab */}
                    <TabsContent value="staff" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Staff Directory ({filteredStaff.length})
                        </h3>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[250px]">
                                  Name
                                </TableHead>
                                <TableHead className="min-w-[200px]">
                                  Role
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStaff.map((member, index) => (
                                <TableRow
                                  key={index}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell className="font-medium">
                                    {member.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {member.role}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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
                                staff.reduce(
                                  (acc, member) => {
                                    acc[member.role] =
                                      (acc[member.role] || 0) + 1;
                                    return acc;
                                  },
                                  {} as Record<string, number>,
                                ),
                              ).map(([role, count]) => {
                                const percentage = (
                                  (count / staff.length) *
                                  100
                                ).toFixed(1);
                                return (
                                  <div key={role} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{role}</span>
                                      <span>
                                        {count} ({percentage}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
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
                                {
                                  staff.filter((member) => member.location)
                                    .length
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Staff with assigned locations
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(
                                  (staff.filter((member) => member.location)
                                    .length /
                                    staff.length) *
                                  100
                                ).toFixed(1)}
                                % of total staff
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
                            AI Research analysis will appear here when
                            available.
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Raw Data Tab */}
                    <TabsContent value="raw-data" className="space-y-4">
                      {/* Original Input Section */}
                      {originalInput && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Search className="h-4 w-4" />
                              Original Input
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-start gap-2">
                              <Badge
                                variant="secondary"
                                className="text-sm py-1.5 px-3 max-w-full"
                              >
                                {isInputExpanded || originalInput.length <= 80
                                  ? originalInput
                                  : `${originalInput.substring(0, 80)}...`}
                              </Badge>
                              {originalInput.length > 80 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setIsInputExpanded(!isInputExpanded)
                                  }
                                  className="text-xs shrink-0"
                                >
                                  {isInputExpanded ? "Show less" : "Show more"}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Raw JSON Section */}
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
                                <code className="block w-full">
                                  {JSON.stringify(rawJson, null, 2)}
                                </code>
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
  );
}
