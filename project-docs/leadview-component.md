# LeadView Component Documentation

## Overview

The `LeadView` component is a React TypeScript component designed to display comprehensive practice information in the LeadDesk frontend application. It provides a clean, card-like interface for viewing dental practice details including contact information, staff directory, and practice statistics.

## Features

### Core Functionality
- **Practice Information Display**: Shows practice name, address, website, phone, and email
- **Practice Statistics**: Displays number of dentists and hygienists
- **Staff Directory**: Table view of all staff members with their roles
- **Responsive Design**: Mobile-friendly layout that adapts to different screen sizes
- **Interactive Elements**: Clickable links for website, phone, and email
- **Missing Data Handling**: Gracefully handles undefined or missing values

### UI Components Used
- **Shadcn UI Components**: Card, Badge, Separator, Table
- **Lucide React Icons**: MapPin, Globe, Phone, Mail, Users, Stethoscope
- **Tailwind CSS**: For styling and responsive design

## File Structure

```
components/
├── lead-view.tsx              # Main LeadView component
├── lead-view-example.tsx      # Example usage demonstrations
├── app-sidebar-custom.tsx     # Custom sidebar component (replaces app header)
└── Searchbar.tsx              # Updated search bar with form handling
```

## Component Interface

### Props

```typescript
interface LeadViewProps {
  leadData: LeadData
}
```

### Data Structure

```typescript
interface LeadData {
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

interface StaffMember {
  name: string
  role: string
}
```

## Mock Data

The component includes three pre-configured mock data sets:

### 1. `mockLeadData` (Default)
- **Practice**: Bright Smiles Dental Clinic
- **Specialty**: General Dentistry & Orthodontics
- **Staff**: 3 dentists, 4 hygienists, 2 additional staff
- **Complete Data**: All fields populated

### 2. `mockLeadDataMinimal`
- **Practice**: Family Dental Care
- **Specialty**: Family Dentistry
- **Staff**: 1 dentist, 2 hygienists
- **Missing Data**: Tests handling of undefined website and email

### 3. `mockLeadDataLarge`
- **Practice**: Metropolitan Dental Group
- **Specialty**: Cosmetic & Restorative Dentistry
- **Staff**: 8 dentists, 12 hygienists, 10 additional staff
- **Complete Data**: Large practice with extensive staff directory

## Integration with Search Functionality

### Search Bar Updates
The search bar component (`components/Searchbar.tsx`) has been enhanced to:
- Accept an `onSearch` callback prop
- Handle form submission and Enter key presses
- Manage internal search query state

### Sidebar Integration
The application now uses a sidebar layout instead of a header:
- **Custom Sidebar** (`components/app-sidebar-custom.tsx`): Replaces the app header with a shadcn sidebar
- **Navigation**: Includes main navigation, quick actions, and tools
- **User Menu**: Avatar and dropdown menu at the bottom of the sidebar
- **Responsive**: Collapsible sidebar that works on mobile and desktop

### Main Page Integration
The main page (`app/page.tsx`) now includes:
- SidebarProvider and SidebarInset for proper sidebar layout
- State management for search results and loading states
- Simulated API call with 1-second delay
- Conditional rendering of LeadView component
- Loading spinner during search operations

## Usage Examples

### Basic Usage

```typescript
import LeadView, { mockLeadData } from "@/components/lead-view"

function MyComponent() {
  return <LeadView leadData={mockLeadData} />
}
```

### With Custom Data

```typescript
import LeadView, { type LeadData } from "@/components/lead-view"

const customData: LeadData = {
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
    { name: "Custom Hygienist 1", role: "Hygienist" }
  ]
}

function MyComponent() {
  return <LeadView leadData={customData} />
}
```

## Styling and Design

### Color Scheme
The component uses the project's existing CSS custom properties:
- **Primary Colors**: `--primary`, `--primary-foreground`
- **Card Colors**: `--card`, `--card-foreground`
- **Muted Colors**: `--muted`, `--muted-foreground`
- **Border Colors**: `--border`

### Layout Structure
1. **Header Section**: Practice name with icon and specialty badge
2. **Information Grid**: Two-column layout for practice info and statistics
3. **Staff Directory**: Full-width table with staff names and roles
4. **Responsive Breakpoints**: Adapts to mobile, tablet, and desktop screens

### Interactive Elements
- **Website Links**: Open in new tab with proper security attributes
- **Phone Links**: Use `tel:` protocol for mobile compatibility
- **Email Links**: Use `mailto:` protocol for email client integration
- **Hover Effects**: Subtle hover states on interactive elements

## Future Enhancements

### Planned Features
1. **Backend Integration**: Replace mock data with actual API calls
2. **Search Filtering**: Filter staff by role or department
3. **Export Functionality**: Export practice data to PDF or CSV
4. **Edit Mode**: Allow editing of practice information
5. **Image Support**: Display practice photos or logos

### API Integration Points
The component is designed to easily integrate with backend APIs:
- Replace mock data in `handleSearch` function
- Add error handling for failed API calls
- Implement pagination for large staff directories
- Add caching for frequently accessed data

## Testing Considerations

### Test Cases
1. **Complete Data**: Test with all fields populated
2. **Missing Data**: Test with undefined website, phone, or email
3. **Empty Staff**: Test with empty staff array
4. **Large Staff**: Test with extensive staff lists
5. **Responsive Design**: Test on various screen sizes

### Accessibility
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets WCAG guidelines for text contrast
- **Focus Management**: Clear focus indicators for interactive elements

## Dependencies

### Required Packages
- `react`: ^18.0.0
- `typescript`: ^5.0.0
- `tailwindcss`: ^3.0.0
- `lucide-react`: ^0.400.0
- `class-variance-authority`: For badge variants
- `@radix-ui/react-separator`: For separator component

### Shadcn UI Components
- `@/components/ui/card`
- `@/components/ui/badge`
- `@/components/ui/separator`
- `@/components/ui/table`

## Troubleshooting

### Common Issues
1. **Missing Icons**: Ensure `lucide-react` is properly installed
2. **Styling Issues**: Verify Tailwind CSS is configured correctly
3. **Type Errors**: Check that all required props are provided
4. **Responsive Issues**: Test on different screen sizes

### Debug Mode
Add console logging to track data flow:
```typescript
console.log('LeadView received data:', leadData)
```

## Contributing

When modifying the LeadView component:
1. Maintain TypeScript type safety
2. Follow existing code style and patterns
3. Test with all three mock data sets
4. Ensure responsive design still works
5. Update this documentation if adding new features
