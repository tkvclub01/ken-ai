/**
 * Centralized Type Utilities & Guards
 * 
 * Provides reusable type utilities and type guards for the Ken-AI application.
 * Enhances type safety across the codebase.
 */

import { Student, Document, KnowledgeBase } from '@/types'

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if value is a valid Student object
 */
export function isStudent(value: unknown): value is Student {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'full_name' in value &&
    'email' in value &&
    'phone' in value &&
    'current_stage' in value &&
    'status' in value
  )
}

/**
 * Type guard to check if value is a valid Document object
 */
export function isDocument(value: unknown): value is Document {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'student_id' in value &&
    'document_type' in value &&
    'file_path' in value &&
    'ocr_status' in value
  )
}

/**
 * Type guard to check if value is a valid KnowledgeBase article
 */
export function isKnowledgeArticle(value: unknown): value is KnowledgeBase {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value
  )
}

/**
 * Type guard to check if string is a valid student status
 */
export function isValidStudentStatus(status: string): status is Student['status'] {
  return ['lead', 'active', 'inactive', 'completed'].includes(status)
}

/**
 * Type guard to check if string is a valid OCR status
 */
export function isValidOcrStatus(status: string): status is Document['ocr_status'] {
  return ['pending', 'processing', 'completed', 'failed'].includes(status)
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Makes specific properties of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Makes specific properties of T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract only the ID from an entity
 */
export type EntityId<T extends { id: string }> = Pick<T, 'id'>

/**
 * Create a partial update type (all fields optional except id)
 */
export type UpdatePayload<T extends { id: string }> = Partial<Omit<T, 'id'>> & Pick<T, 'id'>

/**
 * Response type for API calls with standardized structure
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Infinite query result type (for useInfiniteQuery)
 */
export interface InfiniteQueryResult<T> {
  pages: T[]
  pageParams: number[]
}

/**
 * Filter options type with type safety
 */
export type FilterOptions<T> = {
  [K in keyof T]?: T[K] | T[K][] | null
}

/**
 * Sort configuration type
 */
export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Search parameters with debouncing support
 */
export interface SearchParams {
  query: string
  filters?: Record<string, any>
  sort?: SortConfig
  page?: number
  limit?: number
}

// ============================================================================
// STUDENT-SPECIFIC TYPES
// ============================================================================

/**
 * Student with enriched pipeline information
 */
export interface StudentWithPipeline extends Student {
  pipeline_stage_name?: string
  days_in_current_stage?: number
  next_action_due?: string
}

/**
 * Student creation form data
 */
export interface StudentFormData {
  full_name: string
  email: string
  phone: string
  date_of_birth?: string
  nationality?: string
  target_country?: string
  target_school?: string
  counselor_id?: string
}

/**
 * Student filter options
 */
export interface StudentFilters {
  status?: Student['status'] | Student['status'][]
  stage?: string | string[]
  counselorId?: string
  nationality?: string
  targetCountry?: string
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// DOCUMENT-SPECIFIC TYPES
// ============================================================================

/**
 * Document upload metadata
 */
export interface DocumentUploadMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  studentId: string
  documentType: string
}

/**
 * Document with OCR results
 */
export interface DocumentWithOCR extends Document {
  ocr_text?: string
  confidence_score?: number
  extracted_fields?: Record<string, any>
}

/**
 * Document filter options
 */
export interface DocumentFilters {
  studentId?: string
  documentType?: string
  ocrStatus?: Document['ocr_status'] | Document['ocr_status'][]
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// KNOWLEDGE BASE TYPES
// ============================================================================

/**
 * Knowledge article with category
 */
export interface KnowledgeArticleWithCategory extends KnowledgeBase {
  category_id?: string
  category_name?: string
  tags?: string[]
  view_count?: number
}

/**
 * Knowledge search result with similarity score
 */
export interface KnowledgeSearchResult {
  id: string
  title: string
  content: string
  similarity: number
  source?: string
  metadata?: any
}

/**
 * Knowledge base filters
 */
export interface KnowledgeFilters {
  categoryId?: string
  searchQuery?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

/**
 * User permissions
 */
export interface UserPermissions {
  canManageUsers: boolean
  canManageStudents: boolean
  canManageDocuments: boolean
  canManageKnowledge: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  visaApproved: number
  visaRejected: number
  totalDocuments: number
  pendingDocuments: number
  totalRevenue: number
  pendingRevenue: number
  growthRate?: {
    students: number
    revenue: number
  }
}

/**
 * Pipeline analytics
 */
export interface PipelineAnalytics {
  stage: string
  count: number
  conversionRate: number
  averageDaysInStage: number
}

/**
 * Revenue tracking
 */
export interface RevenueData {
  month: string
  revenue: number
  target: number
  growth: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Application error with context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthError'
  }
}

/**
 * Authorization error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely parse JSON with type checking
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json)
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Assert that a value matches expected type (runtime check)
 */
export function assertType<T>(value: unknown, typeName: string): asserts value is T {
  if (typeof value !== typeof ({} as T)) {
    throw new TypeError(`Expected ${typeName}, got ${typeof value}`)
  }
}

/**
 * Narrow array type by filtering out null/undefined
 */
export function filterNonNull<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((item): item is T => item != null)
}

/**
 * Create a typed record with default values
 */
export function createRecord<K extends string | number | symbol, V>(
  keys: K[],
  defaultValue: V
): Record<K, V> {
  return keys.reduce((acc, key) => {
    acc[key] = defaultValue
    return acc
  }, {} as Record<K, V>)
}
