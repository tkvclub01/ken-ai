import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone)
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

/**
 * Get pipeline stage color
 */
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    lead: '#6B7280',
    applied: '#3B82F6',
    interview: '#F59E0B',
    visa: '#8B5CF6',
    departed: '#10B981',
    completed: '#059669',
  }
  return colors[stage.toLowerCase()] || '#6B7280'
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  const diff = new Date(date2).getTime() - new Date(date1).getTime()
  return Math.round(diff / oneDay)
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date()
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
