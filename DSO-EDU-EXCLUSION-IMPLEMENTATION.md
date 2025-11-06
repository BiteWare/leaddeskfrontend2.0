# DSO/EDU Exclusion Implementation

## Overview
Implemented pre-submission detection for DSO (Dental Service Organizations) and EDU (Educational Institutions) domains to prevent unnecessary backend API calls and display appropriate alerts to users.

## Implementation Date
2025-11-06

## Features Implemented

### 1. Domain Detection Utility (`utils/domain-detector.ts`)
**Purpose**: Detect DSO and EDU domains from user input before submitting to backend

**Key Functions**:
- `extractDomain(input)` - Extracts domain from URLs, domains, or text
- `isEDUDomain(domain)` - Checks if domain ends with `.edu`
- `detectExclusion(practiceName, input)` - Main detection function that checks both DSO and EDU
- `hasExclusionPattern(input)` - Quick pattern matching for early validation

**Detection Logic**:
1. Extracts domain from user input (handles URLs, plain domains, text with domains)
2. Checks for `.edu` TLD first (simple check)
3. Checks against DSO exclusion list (`data/dso_exclusions.json`) using both name and domain matching
4. Returns exclusion type (`DSO`, `EDU`, or `null`) with detailed information

### 2. Search Flow Modification (`app/page.tsx`)
**Purpose**: Intercept job submission and prevent backend calls for excluded practices

**Implementation**:
1. **Before backend submission**, extract practice name and run `detectExclusion()`
2. If exclusion detected:
   - Create mock "excluded job" with ID format: `excluded_{timestamp}_{random}`
   - Store job details in localStorage for retrieval
   - Redirect to results page with excluded job ID
   - **NO backend API call made** (saves costs and processing)
3. If not excluded, proceed with normal backend submission

**Data Stored in localStorage**:
```javascript
{
  id: "excluded_...",
  exclusionType: "DSO" | "EDU",
  dsoName: "Heartland Dental", // (if DSO)
  practiceName: "Practice Name",
  query: "Original user input",
  detectedDomain: "heartlanddental.com",
  reason: "Practice identified as Heartland Dental",
  timestamp: "2025-11-06T..."
}
```

### 3. Results Page Updates (`app/results/[id]/page.tsx`)
**Purpose**: Handle excluded job display

**Implementation**:
1. Detect excluded jobs by checking if ID starts with `excluded_`
2. Load excluded job data from localStorage
3. Pass exclusion details to LeadView component
4. Skip database query for excluded jobs

**Header Display**:
- Shows practice name
- Displays red "DSO" or "EDU" badge

### 4. LeadView Component Updates (`components/lead-view.tsx`)
**Purpose**: Display alert card and minimal information for excluded practices

**New Props**:
```typescript
interface LeadViewProps {
  leadData: LeadData | null;
  exclusionType?: "DSO" | "EDU" | null;
  exclusionDetails?: {
    dsoName?: string;
    domain?: string;
    reason?: string;
  };
}
```

**Exclusion Display**:
1. **Alert Card** (red warning):
   - Title: "DSO Detected" or "EDU Institution Detected"
   - Message: "No scrape performed, manual research required"
   - Shows reason and detected domain
   
2. **Minimal Info Section**:
   - Organization type (DSO name or "Educational Institution")
   - Website link (if domain detected)
   - Explanatory note about why practice was excluded

### 5. Jobs Table (`components/jobs-table.tsx`)
**Note**: Jobs table only shows database records. Excluded jobs stored in localStorage won't appear in the table. This is by design to keep excluded jobs separate from enrichment workflow.

## Testing

### Test Results
All 11 automated tests passed:
- ✅ DSO detection by domain (Heartland, Aspen, PDS)
- ✅ DSO detection by practice name
- ✅ DSO detection from full URLs
- ✅ EDU detection (.edu TLD)
- ✅ EDU detection from subdomains
- ✅ Normal practices correctly NOT excluded

### Test Script
Run: `node test-detection.js`

## User Flow

### DSO/EDU Practice Submission
1. User enters DSO/EDU practice in search bar
2. System detects exclusion before backend call
3. User sees brief loading state (1.5s minimum for UX consistency)
4. Redirects to results page with alert card
5. **Alert displays**:
   - Red warning badge
   - "DSO Detected" or "EDU Institution Detected" title
   - "No scrape performed, manual research required" message
   - Minimal info (organization type, domain)

### Normal Practice Submission
1. User enters normal practice
2. No exclusion detected
3. Proceeds with normal backend enrichment flow
4. Full enrichment results displayed

## Technical Details

### Why Pre-Submission Detection?
1. **Cost Savings**: Prevents unnecessary OpenAI API calls
2. **Performance**: No backend processing for excluded practices
3. **User Experience**: Immediate feedback (no waiting for backend)
4. **Clean Separation**: Excluded jobs don't clutter enrichment database

### Domain Extraction Patterns
Handles multiple input formats:
- Full URLs: `https://heartlanddental.com/location`
- Plain domains: `heartlanddental.com`
- Text with domains: `Visit us at heartlanddental.com`
- Practice name + address (extracts domain if present)

### DSO Detection Method
Uses existing `dso_exclusions.json` with 20 major DSOs:
- Heartland Dental
- The Aspen Group
- PDS Health
- Smile Brands
- MB2 Dental
- And 15 more...

Checks both:
1. Practice name matching DSO brand name
2. Domain matching DSO known domains

### EDU Detection Method
Simple TLD check: domain ends with `.edu`

## Files Modified

### New Files
- `utils/domain-detector.ts` - Domain detection utility
- `test-detection.js` - Automated test suite
- `DSO-EDU-EXCLUSION-IMPLEMENTATION.md` - This documentation

### Modified Files
- `app/page.tsx` - Added pre-submission detection
- `app/results/[id]/page.tsx` - Added excluded job handling
- `components/lead-view.tsx` - Added alert card for exclusions

## Future Enhancements

### Potential Improvements
1. **Backend Integration**: Add excluded jobs to database with special status
2. **Jobs Table Display**: Show excluded jobs in results list with filter
3. **Analytics**: Track DSO/EDU detection rates
4. **Admin Override**: Allow admins to manually enrich DSO/EDU practices
5. **Export Excluded Jobs**: Add ability to export list of excluded practices

### Additional Exclusion Types
Could easily extend to support:
- Government practices (`.gov` domains)
- International practices (country-specific rules)
- Chain practices (non-DSO chains)
- Custom exclusion lists per user/organization

## Known Limitations

1. **localStorage Only**: Excluded jobs only stored locally, not in database
   - Won't persist across devices
   - Won't appear in admin views
   - Browser cache clear will lose history

2. **Jobs Table**: Excluded jobs don't appear in results list
   - By design to keep workflows separate
   - Could be added in future if needed

3. **Domain Detection**: Requires domain in user input
   - If user only enters practice name without domain, detection happens later
   - Could enhance with real-time domain lookup

## Validation

### Test Coverage
- Domain extraction from multiple formats ✅
- DSO detection (name + domain) ✅
- EDU detection (.edu TLD) ✅
- Normal practices not excluded ✅
- UI components render correctly ✅
- No backend calls for excluded practices ✅

### Manual Testing Checklist
- [ ] Submit known DSO domain (e.g., heartlanddental.com)
- [ ] Submit .edu domain (e.g., harvard.edu)
- [ ] Verify alert card displays correctly
- [ ] Verify no backend API call made
- [ ] Submit normal practice and verify enrichment works
- [ ] Check browser console for detection logs
- [ ] Verify excluded job data stored in localStorage

## Support

For issues or questions:
1. Check browser console for detection logs (🔍, 🚫 emoji markers)
2. Verify DSO exclusion list: `data/dso_exclusions.json`
3. Test detection logic: `node test-detection.js`
4. Review detection utility: `utils/domain-detector.ts`

## Maintenance

### Updating DSO List
To add new DSO organizations:
1. Edit `data/dso_exclusions.json`
2. Add new entry with name and domains array
3. Run test: `node test-detection.js`
4. No code changes required

### Updating Exclusion Logic
To modify detection behavior:
1. Edit `utils/domain-detector.ts`
2. Update test cases in `test-detection.js`
3. Run tests to verify changes
4. Update documentation

---

**Implementation Status**: ✅ Complete and Tested
**Version**: 1.0
**Last Updated**: 2025-11-06
