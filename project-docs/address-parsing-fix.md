# Address Parsing Fix - Search Practices API

## Issue

The address field was being sent as an empty string to the n8n webhook, even when users entered a full "Practice Name + Address" string in the search bar.

**Example webhook payload (before fix):**
```json
{
  "companyName": "Spotsylvania Voc Center",
  "address": "",
  "user_id": "08a1f631-250b-4458-a037-ac44f8b65a8f"
}
```

## Root Cause

In `app/api/search-practices/route.ts`, the address was being extracted twice, but the first extraction discarded the address portion before the second extraction could capture it.

**Buggy code flow:**

```typescript
// FIRST EXTRACTION (lines 58-62) - For exclusion check
let companyName = query.trim();
const nameMatch = companyName.match(/^(.*?)(\d.*)$/);
if (nameMatch) {
  companyName = nameMatch[1].trim();  // Address DISCARDED here
}

const exclusionCheck = checkMasterExclusion(companyName, query);

// ... later ...

// SECOND EXTRACTION (lines 109-118) - For webhook payload
let addr = address || "";
if (!addr) {
  const match = companyName.match(/^(.*?)(\d.*)$/);  // Matches against ALREADY-STRIPPED companyName
  if (match) {
    companyName = match[1].trim();
    addr = match[2].trim();  // Never executes - no digits in companyName anymore
  }
}
```

## Fix

Consolidate the parsing to happen once at the start, before the exclusion check:

```typescript
// Parse query into company name and address ONCE
let companyName = query.trim();
let addr = address || "";

if (!addr) {
  const match = query.trim().match(/^(.*?)(\d.*)$/);  // Match against ORIGINAL query
  if (match) {
    companyName = match[1].trim();
    addr = match[2].trim();
  }
}

// Then do exclusion check with properly parsed companyName
const exclusionCheck = checkMasterExclusion(companyName, query);
```

## File Changed

- `app/api/search-practices/route.ts` - Lines 56-67

## Additional Change

Added educational exclusion keywords to `data/master-exclusion.json`:
- `"voc center"` - Catches abbreviated vocational center names
- `"voc school"` - Catches abbreviated vocational school names  
- `"k12"` - Catches K-12 school district domains (e.g., `spotsylvania.k12.va.us`)

## Testing

After fix, a query like `"Dental Office 123 Main St"` will produce:
```json
{
  "companyName": "Dental Office",
  "address": "123 Main St",
  "user_id": "..."
}
```

## Backend Repo Note

The same fix needs to be applied to any other repository that has a similar search-practices API route with the same address parsing logic.
