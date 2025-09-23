// Example usage of LeadView component
// This file demonstrates how to use the LeadView component independently

import React from "react"
import LeadView, { mockLeadData, mockLeadDataMinimal, mockLeadDataLarge, type LeadData } from "./lead-view"

// Example 1: Using the default mock data
export function LeadViewExample1() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Example 1: Default Mock Data</h2>
      <LeadView leadData={mockLeadData} />
    </div>
  )
}

// Example 2: Using minimal mock data
export function LeadViewExample2() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Example 2: Minimal Data</h2>
      <LeadView leadData={mockLeadDataMinimal} />
    </div>
  )
}

// Example 3: Using large mock data
export function LeadViewExample3() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Example 3: Large Practice</h2>
      <LeadView leadData={mockLeadDataLarge} />
    </div>
  )
}

// Example 4: Using custom data
export function LeadViewExample4() {
  const customLeadData: LeadData = {
    practiceName: "Custom Dental Practice",
    practiceAddress: "123 Custom Street, Custom City, CC 12345",
    practiceWebsite: "https://customdental.com",
    practicePhone: "(555) CUSTOM-1",
    practiceEmail: "custom@customdental.com",
    practiceSpecialty: "Custom Specialty",
    numberOfDentists: 2,
    numberOfHygienists: 3,
    staff: [
      { name: "Dr. Custom One", role: "Owner" },
      { name: "Dr. Custom Two", role: "Associate" },
      { name: "Custom Hygienist 1", role: "Hygienist" },
      { name: "Custom Hygienist 2", role: "Hygienist" },
      { name: "Custom Hygienist 3", role: "Hygienist" }
    ]
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Example 4: Custom Data</h2>
      <LeadView leadData={customLeadData} />
    </div>
  )
}

// Example 5: Multiple lead views in a grid
export function LeadViewGridExample() {
  const leadDataArray = [mockLeadData, mockLeadDataMinimal, mockLeadDataLarge]

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Multiple Practices Grid</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {leadDataArray.map((leadData, index) => (
          <div key={index} className="transform hover:scale-105 transition-transform duration-200">
            <LeadView leadData={leadData} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Example 6: Conditional rendering based on data availability
export function ConditionalLeadViewExample() {
  const [selectedPractice, setSelectedPractice] = React.useState<LeadData | null>(null)
  const practices = [mockLeadData, mockLeadDataMinimal, mockLeadDataLarge]

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Practice Selector</h2>
      
      <div className="mb-6">
        <select 
          onChange={(e) => {
            const index = parseInt(e.target.value)
            setSelectedPractice(index >= 0 ? practices[index] : null)
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="-1">Select a practice...</option>
          {practices.map((practice, index) => (
            <option key={index} value={index}>
              {practice.practiceName}
            </option>
          ))}
        </select>
      </div>

      {selectedPractice ? (
        <LeadView leadData={selectedPractice} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please select a practice to view details</p>
        </div>
      )}
    </div>
  )
}
