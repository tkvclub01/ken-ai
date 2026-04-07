import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: 'school-logos' | 'school-documents',
  path: string
): Promise<string | null> {
  const supabase = createClient()
  
  try {
    // Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${path}/${Date.now()}_${sanitizedFileName}`
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(uploadError.message)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error: any) {
    console.error('Failed to upload file:', error)
    toast.error('Không thể tải lên tệp', {
      description: error.message || 'Vui lòng thử lại'
    })
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: 'school-logos' | 'school-documents',
  filePath: string
): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      throw new Error(error.message)
    }

    return true
  } catch (error: any) {
    console.error('Failed to delete file:', error)
    toast.error('Không thể xóa tệp', {
      description: error.message || 'Vui lòng thử lại'
    })
    return false
  }
}

/**
 * Convert JSON array to CSV string
 */
export function jsonToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        const escaped = String(value ?? '').replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

/**
 * Parse CSV string to JSON array
 */
export function csvToJSON(csv: string): any[] {
  const lines = csv.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const result = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index]
      })
      result.push(obj)
    }
  }

  return result
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string): void {
  const csv = jsonToCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Kích thước tệp vượt quá ${maxSizeMB}MB`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Loại tệp không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}
