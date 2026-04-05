# 📚 HƯỚNG DẪN TYPE SAFETY & ERROR HANDLING

**Ngày:** 2026-04-04  
**Phase:** 4.2 & 4.4 - Type Safety & Error Handling

---

## 🎯 TỔNG QUAN

Trong session này, tôi đã triển khai:

1. ✅ **Centralized Type Utilities** (`src/types/utils.ts`) - 449 dòng
2. ✅ **Comprehensive Error Handling** (`src/lib/errors.ts`) - 487 dòng

Tổng cộng: **~1,000 dòng code** tăng cường type safety và error handling.

---

## 📦 CENTRALIZED TYPE UTILITIES

### File: `src/types/utils.ts`

### 1. Type Guards

#### Kiểm tra Student
```typescript
import { isStudent } from '@/types/utils'

const data = await fetchStudent(id)

if (isStudent(data)) {
  // TypeScript knows data is Student type here
  console.log(data.full_name) // ✅ Type-safe
} else {
  console.error('Invalid student data')
}
```

#### Kiểm tra Document
```typescript
import { isDocument } from '@/types/utils'

if (isDocument(doc)) {
  console.log(doc.file_path) // ✅ Type-safe
}
```

#### Kiểm tra Status
```typescript
import { isValidStudentStatus } from '@/types/utils'

const status = getStatusFromAPI()

if (isValidStudentStatus(status)) {
  // TypeScript knows status is 'lead' | 'active' | 'inactive' | 'completed'
  updateStudentStatus(id, status) // ✅ Type-safe
}
```

---

### 2. Utility Types

#### RequireFields - Make fields required
```typescript
import { RequireFields } from '@/types/utils'

type StudentWithRequiredEmail = RequireFields<Student, 'email' | 'phone'>

// Now email and phone are required (not optional)
const student: StudentWithRequiredEmail = {
  id: '123',
  full_name: 'John Doe',
  email: 'john@example.com',  // Required
  phone: '123456789',         // Required
  // ... other fields
}
```

#### OptionalFields - Make fields optional
```typescript
import { OptionalFields } from '@/types/utils'

type PartialStudent = OptionalFields<Student, 'email' | 'phone'>

// Now email and phone are optional
const student: PartialStudent = {
  id: '123',
  full_name: 'John Doe',
  // email and phone not required
}
```

#### UpdatePayload - For update operations
```typescript
import { UpdatePayload } from '@/types/utils'

type StudentUpdatePayload = UpdatePayload<Student>

// All fields optional except id
const payload: StudentUpdatePayload = {
  id: '123',           // Required
  full_name: 'New Name', // Optional
  email: 'new@email.com', // Optional
}
```

#### ApiResponse - Standardized API response
```typescript
import { ApiResponse } from '@/types/utils'

async function fetchStudents(): Promise<ApiResponse<Student[]>> {
  try {
    const data = await api.get('/students')
    return {
      success: true,
      data: data.students,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Failed to fetch students',
        code: 'FETCH_ERROR',
      },
    }
  }
}
```

#### PaginatedResponse - For paginated data
```typescript
import { PaginatedResponse } from '@/types/utils'

interface StudentsResponse extends PaginatedResponse<Student> {}

const response: StudentsResponse = {
  success: true,
  data: students,
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false,
  },
}
```

---

### 3. Domain-Specific Types

#### Student Types
```typescript
import { 
  StudentWithPipeline,
  StudentFormData,
  StudentFilters 
} from '@/types/utils'

// Student with enriched pipeline info
const student: StudentWithPipeline = {
  ...baseStudent,
  pipeline_stage_name: 'Application',
  days_in_current_stage: 5,
  next_action_due: '2026-04-10',
}

// Form data for creating student
const formData: StudentFormData = {
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '123456789',
  nationality: 'Vietnam',
  target_country: 'USA',
}

// Filters for student list
const filters: StudentFilters = {
  status: ['active', 'lead'],
  stage: 'application',
  counselorId: 'counselor-123',
  searchQuery: 'John',
  dateFrom: '2026-01-01',
  dateTo: '2026-12-31',
}
```

#### Document Types
```typescript
import {
  DocumentUploadMetadata,
  DocumentWithOCR,
  DocumentFilters
} from '@/types/utils'

// Upload metadata
const metadata: DocumentUploadMetadata = {
  fileName: 'passport.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  uploadedBy: 'user-123',
  studentId: 'student-456',
  documentType: 'passport',
}

// Document with OCR results
const doc: DocumentWithOCR = {
  ...baseDocument,
  ocr_text: 'Extracted text...',
  confidence_score: 0.95,
  extracted_fields: {
    name: 'John Doe',
    passport_number: 'AB123456',
  },
}
```

#### Knowledge Base Types
```typescript
import {
  KnowledgeArticleWithCategory,
  KnowledgeSearchResult,
  KnowledgeFilters
} from '@/types/utils'

// Article with category
const article: KnowledgeArticleWithCategory = {
  ...baseArticle,
  category_id: 'cat-123',
  category_name: 'Visa Requirements',
  tags: ['visa', 'usa', 'requirements'],
  view_count: 150,
}

// Search result with similarity
const result: KnowledgeSearchResult = {
  id: 'article-123',
  title: 'US Visa Requirements',
  content: 'To apply for a US visa...',
  similarity: 0.89,
  source: 'knowledge_base',
}
```

---

### 4. Error Classes

#### AppError - Base error class
```typescript
import { AppError } from '@/types/utils'

throw new AppError(
  'Something went wrong',
  'CUSTOM_ERROR',
  500,
  { context: 'Additional info' }
)
```

#### ValidationError
```typescript
import { ValidationError } from '@/types/utils'

throw new ValidationError('Invalid email format', 'email')
```

#### AuthError
```typescript
import { AuthError } from '@/types/utils'

throw new AuthError('Token expired')
```

#### ForbiddenError
```typescript
import { ForbiddenError } from '@/types/utils'

throw new ForbiddenError('Insufficient permissions')
```

#### NotFoundError
```typescript
import { NotFoundError } from '@/types/utils'

throw new NotFoundError('Student')
// Message: "Student not found"
```

---

### 5. Helper Functions

#### safeJsonParse
```typescript
import { safeJsonParse } from '@/types/utils'

const data = safeJsonParse<{ name: string }>(
  jsonString,
  { name: 'Default' } // Fallback value
)
```

#### filterNonNull
```typescript
import { filterNonNull } from '@/types/utils'

const items: (Student | null | undefined)[] = [
  student1,
  null,
  student2,
  undefined,
  student3,
]

const validItems = filterNonNull(items)
// Type: Student[] (null/undefined removed)
```

#### createRecord
```typescript
import { createRecord } from '@/types/utils'

const statusCounts = createRecord(
  ['lead', 'active', 'inactive', 'completed'],
  0
)
// Result: { lead: 0, active: 0, inactive: 0, completed: 0 }
```

---

## 🛡️ COMPREHENSIVE ERROR HANDLING

### File: `src/lib/errors.ts`

### 1. Centralized Error Handler

#### Basic Usage
```typescript
import { handleError } from '@/lib/errors'

try {
  const student = await fetchStudent(id)
  setStudent(student)
} catch (error) {
  handleError(error, {
    showToast: true,
    logToConsole: true,
    reportToSentry: true,
  })
}
```

#### With Custom Message
```typescript
try {
  await deleteStudent(id)
} catch (error) {
  handleError(error, {
    customMessage: 'Không thể xóa student',
  })
}
```

#### Silent Error Handling
```typescript
try {
  await logAnalytics(event)
} catch (error) {
  // Don't show toast, just log
  handleError(error, {
    showToast: false,
    logToConsole: true,
    reportToSentry: false,
  })
}
```

---

### 2. Async Helpers

#### safeAsync - Return tuple instead of throw
```typescript
import { safeAsync } from '@/lib/errors'

const [data, error] = await safeAsync(fetchStudents())

if (error) {
  console.error('Failed:', error.message)
  return
}

// data is guaranteed to be non-null here
setStudents(data)
```

#### withErrorHandler - Automatic handling
```typescript
import { withErrorHandler } from '@/lib/errors'

const student = await withErrorHandler(
  () => fetchStudent(id),
  { showToast: true }
)

if (!student) {
  // Error already handled
  return
}

setStudent(student)
```

#### retryWithBackoff - Automatic retry
```typescript
import { retryWithBackoff } from '@/lib/errors'

try {
  const data = await retryWithBackoff(
    () => fetchData(),
    {
      maxRetries: 3,
      initialDelay: 1000,  // 1 second
      maxDelay: 10000,     // 10 seconds max
      backoffFactor: 2,    // Exponential: 1s, 2s, 4s
    }
  )
  setData(data)
} catch (error) {
  // All retries exhausted
  handleError(error)
}
```

---

### 3. Supabase Error Handling

#### handleSupabaseError
```typescript
import { handleSupabaseError } from '@/lib/errors'

const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('id', id)
  .single()

if (error) {
  const appError = handleSupabaseError(error)
  handleError(appError)
  return
}

setStudent(data)
```

---

### 4. Form Validation

#### handleFormValidation
```typescript
import { handleFormValidation } from '@/lib/errors'

const validationErrors = {
  email: ['Invalid email format'],
  phone: ['Phone number is required'],
}

const errors = handleFormValidation(validationErrors)

errors.forEach(error => {
  console.log(error.field, error.message)
  // "email" "Invalid email format"
  // "phone" "Phone number is required"
})
```

---

### 5. Error Recovery

#### Check if recoverable
```typescript
import { isRecoverableError, getSuggestedAction } from '@/lib/errors'

try {
  await fetchData()
} catch (error) {
  const appError = normalizeError(error)
  
  if (isRecoverableError(appError)) {
    const action = getSuggestedAction(appError)
    console.log('Suggested:', action)
    // "Check your internet connection and try again"
    
    // Show retry button
    setShowRetry(true)
  }
}
```

---

## 🎨 INTEGRATION EXAMPLES

### Example 1: Student Hook with Error Handling

```typescript
import { useQuery } from '@tanstack/react-query'
import { handleError, handleSupabaseError } from '@/lib/errors'
import { isStudent } from '@/types/utils'

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }

      if (!isStudent(data)) {
        throw new ValidationError('Invalid student data')
      }

      return data
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        reportToSentry: true,
      })
    },
  })
}
```

### Example 2: Mutation with Retry

```typescript
import { useMutation } from '@tanstack/react-query'
import { retryWithBackoff, handleError } from '@/lib/errors'

export function useUpdateStudent() {
  return useMutation({
    mutationFn: async ({ id, data }: UpdatePayload<Student>) => {
      return retryWithBackoff(
        async () => {
          const { data: result, error } = await supabase
            .from('students')
            .update(data)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          return result
        },
        { maxRetries: 2 }
      )
    },
    onError: (error) => {
      handleError(error, {
        customMessage: 'Cập nhật student thất bại',
      })
    },
  })
}
```

### Example 3: Component with Type Guards

```typescript
import { isStudent, StudentWithPipeline } from '@/types/utils'

function StudentCard({ data }: { data: unknown }) {
  if (!isStudent(data)) {
    return <div>Invalid student data</div>
  }

  const student = data as StudentWithPipeline
  
  return (
    <div>
      <h3>{student.full_name}</h3>
      <p>{student.email}</p>
      {student.pipeline_stage_name && (
        <Badge>{student.pipeline_stage_name}</Badge>
      )}
    </div>
  )
}
```

---

## 📊 BENEFITS

### Type Safety Benefits
- ✅ **Compile-time checking** - Catch errors before runtime
- ✅ **IntelliSense support** - Better IDE autocomplete
- ✅ **Refactoring safety** - Rename types safely
- ✅ **Documentation** - Types serve as documentation
- ✅ **Code consistency** - Enforce patterns across team

### Error Handling Benefits
- ✅ **Consistent UX** - Uniform error messages
- ✅ **Better debugging** - Structured error logging
- ✅ **Production monitoring** - Sentry integration
- ✅ **User-friendly** - Clear error messages
- ✅ **Recovery options** - Retry mechanisms

---

## 🧪 TESTING

### Test Type Guards
```typescript
import { isStudent, isValidStudentStatus } from '@/types/utils'

describe('Type Guards', () => {
  it('should validate student object', () => {
    const validStudent = {
      id: '123',
      full_name: 'John',
      email: 'john@test.com',
      phone: '123',
      current_stage: 'lead',
      status: 'active',
    }
    
    expect(isStudent(validStudent)).toBe(true)
    expect(isStudent(null)).toBe(false)
  })

  it('should validate student status', () => {
    expect(isValidStudentStatus('active')).toBe(true)
    expect(isValidStudentStatus('invalid')).toBe(false)
  })
})
```

### Test Error Handlers
```typescript
import { handleError, normalizeError } from '@/lib/errors'

describe('Error Handling', () => {
  it('should normalize errors', () => {
    const error = normalizeError(new Error('Test'))
    expect(error.message).toBe('Test')
    expect(error.code).toBe('UNKNOWN_ERROR')
  })

  it('should handle network errors', () => {
    const error = normalizeError(new Error('Network request failed'))
    expect(error.code).toBe('NETWORK_ERROR')
  })
})
```

---

## 📚 RESOURCES

- **[utils.ts](./src/types/utils.ts)** - Type utilities (449 lines)
- **[errors.ts](./src/lib/errors.ts)** - Error handling (487 lines)
- **[HUONG_DAN_MONITORING.md](./HUONG_DAN_MONITORING.md)** - Monitoring guide

---

## ✅ CHECKLIST

### Type Safety
- [ ] Use type guards for runtime validation
- [ ] Apply utility types where appropriate
- [ ] Use domain-specific types for clarity
- [ ] Add JSDoc comments to custom types
- [ ] Export types from central location

### Error Handling
- [ ] Use centralized handleError function
- [ ] Configure Sentry reporting appropriately
- [ ] Provide user-friendly error messages
- [ ] Implement retry logic for transient errors
- [ ] Log errors with proper context

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Production-ready
