export interface CSVRow {
  [key: string]: string
}

export interface ParsedCSV {
  headers: string[]
  rows: CSVRow[]
  totalRows: number
}

export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: CSVRow = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return {
    headers,
    rows,
    totalRows: rows.length
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add the last field
  result.push(current.trim())
  
  return result
}

export function validateCSVHeaders(headers: string[]): { isValid: boolean; missingColumns: string[] } {
  const requiredColumns = ['Location Name', 'Ship Street', 'Ship City', 'Ship State']
  const missingColumns: string[] = []
  
  for (const column of requiredColumns) {
    if (!headers.some(header => 
      header.trim() === column
    )) {
      missingColumns.push(column)
    }
  }
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  }
}

export function extractLeadData(row: CSVRow): {
  practiceName?: string
  street?: string
  city?: string
  state?: string
} {
  const practiceName = row['Location Name'] || ''
  const street = row['Ship Street'] || ''
  const city = row['Ship City'] || ''
  const state = row['Ship State'] || ''
  
  return {
    practiceName: practiceName.trim() || undefined,
    street: street.trim() || undefined,
    city: city.trim() || undefined,
    state: state.trim() || undefined
  }
}

/**
 * Validate that a CSV file has the correct format for lead enrichment
 * @param parsedCSV - The parsed CSV data
 * @returns object - Validation result with success status and any errors
 */
export function validateLeadEnrichmentCSV(parsedCSV: ParsedCSV): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = []
  
  // Check headers
  const headerValidation = validateCSVHeaders(parsedCSV.headers)
  if (!headerValidation.isValid) {
    errors.push(`Missing required columns: ${headerValidation.missingColumns.join(', ')}`)
  }
  
  // Check row count
  if (parsedCSV.rows.length === 0) {
    errors.push('No data rows found in the file')
  } else if (parsedCSV.rows.length > 20) {
    errors.push('Maximum 20 rows allowed per upload')
  }
  
  // Check data completeness
  for (const [i, row] of parsedCSV.rows.entries()) {
    const rowNumber = i + 2 // +2 because we start from row 2 (after header)
    const requiredFields = ['Location Name', 'Ship Street', 'Ship City', 'Ship State']
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${rowNumber} is missing data in "${field}"`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
} 