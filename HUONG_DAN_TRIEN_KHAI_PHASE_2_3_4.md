# 📖 HƯỚNG DẪN TRIỂN KHAI CHI TIẾT PHASE 2-4 - KEN-AI

**Ngày tạo:** 2026-04-04  
**Ngôn ngữ:** Tiếng Việt  
**Trạng thái:** Đang triển khai

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 2.1: Optimistic Updates ✓
- ✅ File: `src/hooks/useOptimisticUpdate.ts` (171 dòng)
- ✅ Cập nhật: `src/hooks/useStudents.ts` - useUpdateStudent
- ✅ **Lợi ích:** UI cập nhật tức thì (0ms latency), tự động rollback khi lỗi

### Phase 2.2: Prefetching Thông Minh ✓
- ✅ File: `src/hooks/usePrefetch.ts` (211 dòng)
- ✅ 5 hàm prefetch: student, students filter, user profile, permissions, knowledge search
- ✅ **Lợi ích:** Dữ liệu có sẵn trong cache → trải nghiệm tức thì

---

## 🚀 TRIỂN KHAI TIẾP THEO

### Phase 2.3: Infinite Queries cho Danh sách Lớn

**Mục tiêu:** Thay thế pagination bằng infinite scroll để UX mượt mà hơn

#### Bước 1: Cài đặt dependency

```bash
npm install react-intersection-observer
```

#### Bước 2: Tạo hook useInfiniteStudents

**File:** `src/hooks/useInfiniteStudents.ts`

```typescript
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types'

const PAGE_SIZE = 20

export function useInfiniteStudents(filters?: {
  status?: string
  stage?: string
  counselorId?: string
}) {
  const supabase = createClient()
  
  return useInfiniteQuery({
    queryKey: ['students-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('students')
        .select('*')
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.counselorId) {
        query = query.eq('counselor_id', filters.counselorId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        return {
          students: [],
          nextPage: undefined,
        }
      }
      
      // Fetch pipeline data
      const studentIds = data.map(s => s.id)
      const { data: pipelineData } = await supabase
        .from('student_pipeline')
        .select('student_id, current_stage_id')
        .in('student_id', studentIds)
      
      const pipelineMap = new Map()
      pipelineData?.forEach((p: any) => {
        pipelineMap.set(p.student_id, p)
      })
      
      const transformedData = data.map((student: any) => ({
        ...student,
        current_stage: pipelineMap.get(student.id)?.current_stage_id || 'lead',
        pipeline_stage_name: 'Lead',
      }))
      
      // Filter by stage after transformation if needed
      let finalData = transformedData
      if (filters?.stage) {
        finalData = transformedData.filter((s: any) => s.current_stage === filters.stage)
      }
      
      return {
        students: finalData as Student[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialPageParam: 0,
  })
}
```

#### Bước 3: Tạo component InfiniteStudentList

**File:** `src/components/features/students/InfiniteStudentList.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useInfiniteStudents } from '@/hooks/useInfiniteStudents'
import { useInView } from 'react-intersection-observer'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePrefetch } from '@/hooks/usePrefetch'

export function InfiniteStudentList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteStudents()
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Load trước 200px
  })
  
  const { prefetchStudent } = usePrefetch()
  
  // Tự động load trang tiếp theo khi sentinel vào viewport
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
        ))}
      </div>
    )
  }
  
  if (isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Có lỗi xảy ra khi tải danh sách</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </Button>
      </Card>
    )
  }
  
  const allStudents = data?.pages.flatMap(page => page.students) || []
  
  if (allStudents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Không có student nào</p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {allStudents.map((student) => (
        <Card 
          key={student.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onMouseEnter={() => prefetchStudent(student.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{student.full_name}</h3>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  {student.current_stage}
                </Badge>
                <Badge variant="outline">
                  {formatDate(student.created_at)}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="ghost">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {/* Sentinel element cho infinite scroll */}
      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Đang tải thêm...</span>
          </div>
        )}
        
        {!hasNextPage && allStudents.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Đã hiển thị tất cả students
          </p>
        )}
      </div>
    </div>
  )
}
```

#### Bước 4: Sử dụng trong Students Page

**File:** `src/app/students/page.tsx`

```typescript
import { InfiniteStudentList } from '@/components/features/students/InfiniteStudentList'

export default function StudentsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Students</h1>
      <InfiniteStudentList />
    </div>
  )
}
```

**Best Practices:**
1. ✅ Dùng `rootMargin: '200px'` để load trước khi user scroll tới
2. ✅ Hiển thị skeleton loading đẹp mắt
3. ✅ Handle error state gracefully
4. ✅ Prefetch chi tiết khi hover
5. ✅ Show "đã load hết" khi không còn data

**Lỗi thường gặp:**
- ❌ Quên set `initialPageParam: 0` → crash
- ❌ Không check `hasNextPage` trước khi fetch → infinite loop
- ❌ Forget cleanup intersection observer → memory leak
- ❌ Load quá nhiều data cùng lúc → performance issue

---

### Phase 3.2: React Query DevTools

#### Bước 1: Cài đặt

```bash
npm install @tanstack/react-query-devtools
```

#### Bước 2: Cập nhật ReactQueryProvider

**File:** `src/hooks/ReactQueryProvider.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
            networkMode: 'online',
          },
          mutations: {
            retry: 1,
            gcTime: 5 * 60 * 1000,
            networkMode: 'always',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Chỉ hiển thị trong development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
```

**Tính năng DevTools:**
- ✅ Xem tất cả queries đang active
- ✅ Inspect cache data
- ✅ Manual refetch/invalidate
- ✅ Xem query timing và status
- ✅ Filter queries by key
- ✅ See mutation state

**Cách sử dụng:**
1. Mở app trong development mode
2. Click nút React Query ở góc phải dưới
3. Explore các tabs: Queries, Mutations, GC
4. Click vào query để xem chi tiết
5. Test manual refetch/invalidate

---

### Phase 3.4: Custom Logging Utility

**File:** `src/hooks/useLogger.ts`

```typescript
'use client'

import { useCallback, useEffect } from 'react'

interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  enabled?: boolean
}

/**
 * Hook logging thông minh với environment awareness
 * - Tự động disable trong production
 * - Configurable log level
 * - Prefix với component name
 * 
 * @example
 * ```tsx
 * const { log } = useLogger('StudentTable', { level: 'debug' })
 * 
 * useEffect(() => {
 *   log('Students loaded', students?.length)
 * }, [students])
 * ```
 */
export function useLogger(componentName: string, options?: LoggerOptions) {
  const { level = 'info', enabled = process.env.NODE_ENV === 'development' } = options || {}
  
  useEffect(() => {
    if (!enabled) return
    
    console.log(`📦 [${componentName}] mounted`)
    
    return () => {
      console.log(`🗑️ [${componentName}] unmounted`)
    }
  }, [componentName, enabled])
  
  const log = useCallback(
    (message: string, data?: any) => {
      if (!enabled) return
      
      const prefix = `[${componentName}]`
      const timestamp = new Date().toISOString()
      
      const logMessage = `${timestamp} ${prefix} ${message}`
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, data || '')
          break
        case 'info':
          console.info(logMessage, data || '')
          break
        case 'warn':
          console.warn(logMessage, data || '')
          break
        case 'error':
          console.error(logMessage, data || '')
          break
      }
    },
    [componentName, level, enabled]
  )
  
  const debug = useCallback((message: string, data?: any) => {
    if (enabled && process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] [${componentName}]`, message, data || '')
    }
  }, [componentName, enabled])
  
  const warn = useCallback((message: string, data?: any) => {
    if (enabled) {
      console.warn(`[WARN] [${componentName}]`, message, data || '')
    }
  }, [componentName, enabled])
  
  const error = useCallback((message: string, err?: any) => {
    if (enabled) {
      console.error(`[ERROR] [${componentName}]`, message, err || '')
    }
  }, [componentName, enabled])
  
  return { log, debug, warn, error }
}
```

**Sử dụng:**

```typescript
// Trong component
export function StudentTable() {
  const { log, debug, error } = useLogger('StudentTable', { level: 'debug' })
  const { data: students, isLoading, isError } = useStudents()
  
  useEffect(() => {
    if (students) {
      log('Students loaded successfully', { count: students.length })
      debug('Student details', students)
    }
  }, [students, log, debug])
  
  useEffect(() => {
    if (isError) {
      error('Failed to load students')
    }
  }, [isError, error])
  
  if (isLoading) {
    log('Loading students...')
    return <Skeleton />
  }
  
  return <div>...</div>
}
```

**Trong hooks:**

```typescript
export function useStudents(filters) {
  const { log, error } = useLogger('useStudents')
  
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      log('Fetching students with filters', filters)
      
      try {
        const { data } = await supabase.from('students').select('*')
        log('Students fetched', { count: data?.length })
        return data
      } catch (err) {
        error('Failed to fetch students', err)
        throw err
      }
    },
  })
}
```

**Best Practices:**
1. ✅ Luôn dùng `enabled` flag để disable trong production
2. ✅ Phân biệt log levels (debug/info/warn/error)
3. ✅ Include timestamp và component name
4. ✅ Log cả success và error cases
5. ✅ Không log sensitive data (passwords, tokens)

---

### Phase 4.1: Reusable Hooks - usePaginatedQuery

**File:** `src/hooks/usePaginatedQuery.ts`

```typescript
'use client'

import { useState } from 'react'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

interface UsePaginatedQueryOptions<T> {
  key: string[]
  fetchFn: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
  staleTime?: number
  gcTime?: number
}

interface UsePaginatedQueryReturn<T> extends Omit<UseQueryResult<T[], Error>, 'data'> {
  data: T[] | undefined
  page: number
  setPage: (page: number) => void
  hasNextPage: boolean
  hasPrevPage: boolean
  goToNext: () => void
  goToPrev: () => void
  goToPage: (newPage: number) => void
  totalPages: number | undefined
}

/**
 * Generic hook cho pagination
 * Giảm code duplication cho các list có phân trang
 * 
 * @example
 * ```typescript
 * const {
 *   data: students,
 *   page,
 *   goToNext,
 *   goToPrev,
 *   hasNextPage,
 *   isLoading,
 * } = usePaginatedQuery({
 *   key: ['students'],
 *   fetchFn: (page, pageSize) => fetchStudents(page, pageSize),
 *   pageSize: 20,
 * })
 * ```
 */
export function usePaginatedQuery<T>({
  key,
  fetchFn,
  pageSize = 20,
  staleTime = 5 * 60 * 1000,
  gcTime = 10 * 60 * 1000,
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryReturn<T> {
  const [page, setPage] = useState(1)
  
  const query = useQuery({
    queryKey: [...key, { page, pageSize }],
    queryFn: () => fetchFn(page, pageSize),
    staleTime,
    gcTime,
  })
  
  const data = query.data
  
  // Giả định hasNextPage nếu data đầy pageSize
  const hasNextPage = data ? data.length === pageSize : false
  const hasPrevPage = page > 1
  
  const goToNext = () => {
    if (hasNextPage) {
      setPage(p => p + 1)
    }
  }
  
  const goToPrev = () => {
    if (hasPrevPage) {
      setPage(p => Math.max(1, p - 1))
    }
  }
  
  const goToPage = (newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage)
    }
  }
  
  // Total pages unknown without total count from API
  const totalPages = undefined
  
  return {
    ...query,
    data,
    page,
    setPage,
    hasNextPage,
    hasPrevPage,
    goToNext,
    goToPrev,
    goToPage,
    totalPages,
  }
}
```

**Sử dụng:**

```typescript
// src/hooks/useStudentsPaginated.ts
import { usePaginatedQuery } from './usePaginatedQuery'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types'

const PAGE_SIZE = 20

export function useStudentsPaginated(filters?: {
  status?: string
  stage?: string
}) {
  const supabase = createClient()
  
  return usePaginatedQuery<Student>({
    key: ['students-paginated', filters],
    fetchFn: async (page, pageSize) => {
      let query = supabase
        .from('students')
        .select('*')
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false })
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },
    pageSize: PAGE_SIZE,
  })
}
```

**Component usage:**

```typescript
export function StudentTableWithPagination() {
  const {
    data: students,
    page,
    goToNext,
    goToPrev,
    hasNextPage,
    hasPrevPage,
    isLoading,
  } = useStudentsPaginated()
  
  if (isLoading) return <Skeleton />
  
  return (
    <div>
      {/* Student list */}
      <div className="flex gap-2 mt-4">
        <Button 
          onClick={goToPrev} 
          disabled={!hasPrevPage}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button 
          onClick={goToNext} 
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

---

## 📊 SO SÁNH CÁC APPROACH

| Feature | Standard Pagination | Infinite Scroll | usePaginatedQuery |
|---------|-------------------|-----------------|-------------------|
| UX | Good | ⭐⭐⭐ Excellent | Good |
| Performance | Better for large datasets | Good for browsing | Better than standard |
| Implementation | Simple | Medium complexity | Reusable |
| Memory Usage | Low | Higher (keeps all pages) | Low |
| SEO Friendly | ✅ Yes | ❌ No | ✅ Yes |
| Best For | Admin tables, reports | Social feeds, chats | General purpose |

---

## 🎯 BEST PRACTICES TỔNG QUÁT

### 1. Caching Strategy

```typescript
// Data ít thay đổi → cache lâu
staleTime: 10 * 60 * 1000,  // 10 phút
gcTime: 30 * 60 * 1000,     // 30 phút

// Data thay đổi thường xuyên → cache ngắn
staleTime: 2 * 60 * 1000,   // 2 phút
gcTime: 5 * 60 * 1000,      // 5 phút

// Real-time data → không cache
staleTime: 0,
gcTime: 0,
```

### 2. Error Handling

```typescript
// Luôn handle errors gracefully
try {
  const { data, error } = await supabase...
  if (error) throw error
  return data
} catch (err) {
  // Log error
  console.error('Operation failed:', err)
  
  // Show user-friendly message
  toast.error('Có lỗi xảy ra', {
    description: 'Vui lòng thử lại sau',
  })
  
  // Re-throw for React Query to handle
  throw err
}
```

### 3. Type Safety

```typescript
// Define types clearly
interface Student {
  id: string
  full_name: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
}

// Use types everywhere
const { data }: { data: Student[] | undefined } = useStudents()

// Type guards
function isStudent(data: any): data is Student {
  return (
    typeof data === 'object' &&
    'id' in data &&
    'full_name' in data &&
    'email' in data
  )
}
```

### 4. Performance Optimization

```typescript
// Memoize expensive calculations
const filteredStudents = useMemo(() => {
  return students?.filter(s => s.status === 'active')
}, [students])

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  // Handler logic
}, [])

// React.memo for pure components
export const StudentCard = React.memo(({ student }: { student: Student }) => {
  return <div>{student.full_name}</div>
})
```

---

## ⚠️ NHỮNG LỖI THƯỜNG GẶP

### 1. Infinite Refetch Loop

**❌ Sai:**
```typescript
const filters = { status: 'active' }
const { data } = useStudents(filters) // Object reference changes every render
```

**✅ Đúng:**
```typescript
const filters = useMemo(() => ({ status: 'active' }), [])
const { data } = useStudents(filters)

// Hoặc tốt hơn
const { data } = useStudents({ status: 'active' }) // Primitive values stable
```

### 2. Memory Leak từ Subscriptions

**❌ Sai:**
```typescript
useEffect(() => {
  const channel = supabase.channel('changes').on(...)
  // Missing cleanup!
}, [])
```

**✅ Đúng:**
```typescript
useEffect(() => {
  const channel = supabase.channel('changes').on(...)
  
  return () => {
    supabase.removeChannel(channel) // Cleanup on unmount
  }
}, [])
```

### 3. Not Handling Loading/Error States

**❌ Sai:**
```typescript
const { data } = useStudents()
return <div>{data.map(s => s.name)}</div> // Crash if data is undefined
```

**✅ Đúng:**
```typescript
const { data, isLoading, isError } = useStudents()

if (isLoading) return <Skeleton />
if (isError) return <ErrorFallback />
if (!data) return null

return <div>{data.map(s => s.name)}</div>
```

### 4. Over-fetching Data

**❌ Sai:**
```typescript
// Fetch all fields when only need few
const { data } = supabase.from('students').select('*')
```

**✅ Đúng:**
```typescript
// Only fetch needed fields
const { data } = supabase
  .from('students')
  .select('id, full_name, email')
```

### 5. Not Invalidating Cache After Mutation

**❌ Sai:**
```typescript
const mutation = useMutation({
  mutationFn: updateStudent,
  onSuccess: () => {
    toast.success('Updated!')
    // Forgot to invalidate cache!
  }
})
```

**✅ Đúng:**
```typescript
const mutation = useMutation({
  mutationFn: updateStudent,
  onSuccess: () => {
    toast.success('Updated!')
    queryClient.invalidateQueries({ queryKey: ['students'] })
  }
})
```

---

## 📈 METRICS & MONITORING

### Key Metrics to Track

1. **Cache Hit Rate**
```typescript
const cache = queryClient.getQueryCache()
const queries = cache.getAll()
const hitRate = queries.filter(q => q.state.data).length / queries.length
console.log('Cache hit rate:', hitRate)
```

2. **Average Query Time**
```typescript
// In React Query DevTools hoặc custom logging
const startTime = performance.now()
const { data } = await fetchData()
const endTime = performance.now()
console.log('Query time:', endTime - startTime, 'ms')
```

3. **Error Rate**
```typescript
let errorCount = 0
let totalCount = 0

// In error handler
totalCount++
errorCount++
console.log('Error rate:', errorCount / totalCount)
```

---

## 🎓 TÀI NGUYÊN HỌC TẬP

### Tiếng Việt
1. [React Query Tiếng Việt](https://react-query.tanstack.com/)
2. [Next.js Documentation](https://nextjs.org/docs)
3. [Supabase Vietnamese Community](https://discord.gg/supabase)

### English
1. [TanStack Query Docs](https://tanstack.com/query/latest)
2. [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
3. [React Patterns](https://reactpatterns.com/)

---

## ✅ CHECKLIST TRIỂN KHAI

### Phase 2: Performance
- [x] 2.1 Optimistic Updates
- [x] 2.2 Prefetching
- [ ] 2.3 Infinite Queries (code provided above)
- [ ] 2.4 Search Caching (already implemented)
- [ ] 2.5 Bundle Optimization

### Phase 3: Monitoring
- [ ] 3.1 Sentry Integration
- [x] 3.2 React Query DevTools (code provided)
- [ ] 3.3 Core Web Vitals
- [x] 3.4 Custom Logging (code provided)
- [ ] 3.5 Query Dashboard

### Phase 4: Code Quality
- [x] 4.1 Reusable Hooks (usePaginatedQuery provided)
- [ ] 4.2 Type Safety Enhancement
- [ ] 4.3 Component Modularization
- [ ] 4.4 Error Handling Patterns
- [ ] 4.5 Testing

---

**Cập nhật lần cuối:** 2026-04-04  
**Người viết:** AI Assistant (Senior Frontend Architect)  
**Review bởi:** [Pending]
