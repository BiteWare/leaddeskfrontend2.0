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
  const requiredColumns = ['email', 'company', 'website']
  const missingColumns: string[] = []
  
  for (const column of requiredColumns) {
    if (!headers.some(header => 
      header.toLowerCase().includes(column.toLowerCase())
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
  email?: string
  company?: string
  website?: string
} {
  const email = row.email || row.Email || row.EMAIL || ''
  const company = row.company || row.Company || row.COMPANY || row.name || row.Name || row.NAME || ''
  const website = row.website || row.Website || row.WEBSITE || row.url || row.Url || row.URL || ''
  
  return {
    email: email.trim() || undefined,
    company: company.trim() || undefined,
    website: website.trim() || undefined
  }
} 