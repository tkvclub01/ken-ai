# 🚀 PHASE 2-4 IMPLEMENTATION GUIDE - KEN-AI

**Status:** In Progress  
**Started:** 2026-04-04  
**Estimated Completion:** 6 weeks

---

## ✅ PHASE 2: PERFORMANCE OPTIMIZATION (COMPLETED ITEMS)

### 2.1 ✅ Optimistic Updates - IMPLEMENTED

**Files Created/Modified:**
- ✅ `src/hooks/useOptimisticUpdate.ts` - Reusable optimistic update helpers
- ✅ `src/hooks/useStudents.ts` - Updated `useUpdateStudent` with optimistic updates

**Implementation:**

```typescript
// Example: Optimistic student update
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Server update logic
      const { data: updated } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      return updated
    },
    
    // OPTIMISTIC: Update UI before server confirms
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['students'] })
      
      const previousStudents = queryClient.getQueryData(['students'])
      
      // Instantly update cache
      queryClient.setQueryData(['students'], (old) => 
        old.map(s => s.id === id ? { ...s, ...data } : s)
      )
      
      return { previousStudents }
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents)
      toast.error('Update failed - data rolled back')
    },
    
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
```

**Reusable Helpers:**

```typescript
// src/hooks/useOptimisticUpdate.ts
import { createListOptimisticUpdate } from '@/hooks/useOptimisticUpdate'

// Usage in any mutation
const mutation = useMutation({
  mutationFn: updateStudent,
  ...createListOptimisticUpdate(['students'], {
    successMessage: 'Student updated successfully',
    rollbackMessage: 'Changes reverted due to error'
  })
})
```

**Benefits:**
- ⚡ **0ms perceived latency** - UI updates instantly
- 🔄 **Automatic rollback** on errors
- 👤 **Better UX** - Users see changes immediately
- 🛡️ **Safe** - Server data eventually reconciles

---

### 2.2 🔄 Prefetching - IN PROGRESS

**Goal:** Load data before user needs it for instant navigation

**Implementation Pattern:**

```typescript
// src/hooks/usePrefetch.ts
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

export function usePrefetch() {
  const queryClient = useQueryClient()
  
  /**
   * Prefetch student details when hovering over list item
   */
  const prefetchStudent = useCallback((studentId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['student', studentId],
      queryFn: () => fetchStudentById(studentId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }, [queryClient])
  
  /**
   * Prefetch next page of students
   */
  const prefetchNextPage = useCallback((currentPage: number) => {
    queryClient.prefetchQuery({
      queryKey: ['students', { page: currentPage + 1 }],
      queryFn: () => fetchStudents({ page: currentPage + 1 }),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
  
  /**
   * Prefetch user profile
   */
  const prefetchUserProfile = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user-profile', userId],
      queryFn: () => fetchUserProfile(userId),
      staleTime: 10 * 60 * 1000,
    })
  }, [queryClient])
  
  return {
    prefetchStudent,
    prefetchNextPage,
    prefetchUserProfile,
  }
}
```

**Usage in StudentTable:**

```tsx
// src/components/features/students/StudentTable.tsx
import { usePrefetch } from '@/hooks/usePrefetch'

export function StudentTable() {
  const { data: students } = useStudents()
  const { prefetchStudent } = usePrefetch()
  
  return (
    <Table>
      <TableBody>
        {students?.map(student => (
          <TableRow
            key={student.id}
            onMouseEnter={() => prefetchStudent(student.id)} // Prefetch on hover
          >
            <TableCell>{student.full_name}</TableCell>
            {/* ... */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Usage in Pagination:**

```tsx
// Pagination component
<Button
  onMouseEnter={() => prefetchNextPage(currentPage)}
  onClick={() => setCurrentPage(currentPage + 1)}
>
  Next Page
</Button>
```

**Best Practices:**
1. ✅ Prefetch on **hover** or **focus** (not on mount)
2. ✅ Use appropriate `staleTime` to avoid refetching
3. ✅ Don't prefetch too aggressively (memory usage)
4. ✅ Monitor cache size in production

---

### 2.3 📄 Infinite Queries - PLANNED

**Goal:** Replace pagination with infinite scroll for better UX

**Implementation:**

```typescript
// src/hooks/useInfiniteStudents.ts
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types'

const PAGE_SIZE = 20

export function useInfiniteStudents(filters?: {
  status?: string
  stage?: string
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
      
      const { data, error } = await query
      
      if (error) throw error
      
      return {
        students: data as Student[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
```

**Usage:**

```tsx
// src/components/features/students/InfiniteStudentList.tsx
import { useInfiniteStudents } from '@/hooks/useInfiniteStudents'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export function InfiniteStudentList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteStudents()
  
  const { ref, inView } = useInView()
  
  // Auto-fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
  
  if (isLoading) return <SkeletonList />
  
  return (
    <div className="space-y-4">
      {data?.pages.map((page) => (
        <div key={page.students[0]?.id}>
          {page.students.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ))}
      
      {/* Sentinel for infinite scroll */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <Spinner />}
        {!hasNextPage && (
          <p className="text-center text-muted-foreground">
            No more students
          </p>
        )}
      </div>
    </div>
  )
}
```

**Installation:**
```bash
npm install react-intersection-observer
```

---

### 2.4 🔍 Search Caching - PLANNED

**Already partially implemented** in KnowledgeBaseSearch. Let's enhance it:

```typescript
// src/hooks/useDebouncedSearch.ts
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useDebouncedSearch<T>(
  query: string,
  searchFn: (query: string) => Promise<T[]>,
  options?: {
    delay?: number
    minChars?: number
    staleTime?: number
  }
) {
  const {
    delay = 300,
    minChars = 2,
    staleTime = 2 * 60 * 1000, // 2 minutes
  } = options || {}
  
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [query, delay])
  
  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => {
      if (debouncedQuery.length < minChars) return []
      return searchFn(debouncedQuery)
    },
    enabled: debouncedQuery.length >= minChars,
    staleTime,
    keepPreviousData: true, // Show previous results while fetching
  })
}
```

**Usage:**

```tsx
// Search component
const [searchQuery, setSearchQuery] = useState('')

const { data: results, isFetching } = useDebouncedSearch(
  searchQuery,
  async (query) => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .ilike('full_name', `%${query}%`)
    return data
  },
  { delay: 300, minChars: 2 }
)

<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search students..."
/>

{isFetching && <Spinner />}
{results?.map(student => <StudentCard key={student.id} student={student} />)}
```

---

### 2.5 📦 Bundle Optimization - PLANNED

**Dynamic Imports for Heavy Components:**

```typescript
// src/app/students/page.tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
const StudentTable = dynamic(
  () => import('@/components/features/students/StudentTable').then(mod => ({ default: mod.StudentTable })),
  { 
    loading: () => <SkeletonTable />,
    ssr: false // Disable SSR if not needed
  }
)

const AnalyticsChart = dynamic(
  () => import('@/components/features/analytics/PipelineChart').then(mod => ({ default: mod.PipelineChart })),
  { 
    loading: () => <SkeletonChart />
  }
)

export default function StudentsPage() {
  return (
    <div>
      <StudentTable />
      <AnalyticsChart />
    </div>
  )
}
```

**Code Splitting Configuration:**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            name: 'vendors',
          },
          charts: {
            test: /[\\/]recharts[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 10,
          },
          editor: {
            test: /[\\/]@tiptap[\\/]/,
            name: 'editor',
            chunks: 'all',
            priority: 10,
          },
        },
      }
    }
    return config
  },
}

export default nextConfig
```

**Bundle Analysis:**

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# Add to package.json scripts
"analyze": "ANALYZE=true next build"
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

---

## 📊 PHASE 3: MONITORING & OBSERVABILITY

### 3.1 🔴 Sentry Integration - PLANNED

**Installation:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Ignore noisy errors
  ignoreErrors: [
    'Network Error',
    'Request failed',
    'ResizeObserver loop limit exceeded',
  ],
  
  beforeSend(event, hint) {
    // Don't send errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(frame => 
      frame.filename?.includes('chrome-extension://')
    )) {
      return null
    }
    return event
  },
})
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
```

**Integration with QueryErrorBoundary:**

```typescript
// src/components/shared/QueryErrorBoundary.tsx
import * as Sentry from '@sentry/nextjs'

public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('🚨 Query Error Boundary caught:', error, errorInfo)
  
  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
      },
    })
  }
  
  this.props.onError?.(error, errorInfo)
}
```

**Source Maps Upload:**

```typescript
// next.config.ts
const { withSentryConfig } = require("@sentry/nextjs")

const nextConfig = {
  // ... your config
}

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true, // Suppresses all logs
    org: "your-org",
    project: "ken-ai",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },
  {
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
)
```

---

### 3.2 🛠️ React Query DevTools - PLANNED

**Installation:**

```bash
npm install @tanstack/react-query-devtools
```

**Integration:**

```typescript
// src/hooks/ReactQueryProvider.tsx
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
      
      {/* Only show in development */}
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

**Features:**
- ✅ Inspect all active queries
- ✅ View cache data
- ✅ Manual refetch/invalidate
- ✅ See query timing and status
- ✅ Filter queries by key

---

### 3.3 📈 Performance Monitoring - PLANNED

**Core Web Vitals Tracking:**

```typescript
// src/lib/web-vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'

export function reportWebVitals(metric: any) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  }
  
  // Send to analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body))
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${metric.name}:`, metric.value)
  }
}

// Register in app/layout.tsx
if (typeof window !== 'undefined') {
  onCLS(reportWebVitals)
  onFID(reportWebVitals)
  onLCP(reportWebVitals)
  onFCP(reportWebVitals)
  onTTFB(reportWebVitals)
}
```

**Installation:**
```bash
npm install web-vitals
```

**Custom Performance Metrics:**

```typescript
// src/hooks/usePerformanceMonitor.ts
'use client'

import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0)
  
  useEffect(() => {
    renderStartTime.current = performance.now()
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current
      
      // Log slow renders (>16ms = dropped frame at 60fps)
      if (renderTime > 16) {
        console.warn(
          `⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to unmount`
        )
        
        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
          // Track slow render
        }
      }
    }
  }, [componentName])
}
```

---

### 3.4 📝 Custom Logging - PLANNED

```typescript
// src/hooks/useLogger.ts
'use client'

import { useCallback, useEffect } from 'react'

interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  enabled?: boolean
}

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
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '')
          break
        case 'info':
          console.info(prefix, message, data || '')
          break
        case 'warn':
          console.warn(prefix, message, data || '')
          break
        case 'error':
          console.error(prefix, message, data || '')
          break
      }
    },
    [componentName, level, enabled]
  )
  
  return { log }
}
```

**Usage:**

```typescript
export function StudentTable() {
  const { log } = useLogger('StudentTable', { level: 'debug' })
  const { data: students } = useStudents()
  
  useEffect(() => {
    log('Students loaded', students?.length)
  }, [students, log])
  
  return <div>...</div>
}
```

---

### 3.5 📊 Query Performance Dashboard - PLANNED

**Simple Internal Dashboard:**

```typescript
// src/components/admin/QueryPerformanceDashboard.tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function QueryPerformanceDashboard() {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  const stats = {
    total: queries.length,
    active: queries.filter(q => q.getObserversCount() > 0).length,
    inactive: queries.filter(q => q.getObserversCount() === 0).length,
    fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    errors: queries.filter(q => q.state.status === 'error').length,
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fetching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.fetching}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.errors}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total > 0 
                ? Math.round(((stats.total - stats.fetching) / stats.total) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Query Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-auto">
            {queries.map(query => (
              <div
                key={query.queryHash}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <code className="text-xs">
                  {JSON.stringify(query.queryKey)}
                </code>
                <div className="flex gap-2">
                  <Badge variant={
                    query.state.status === 'error' ? 'destructive' :
                    query.state.fetchStatus === 'fetching' ? 'default' :
                    'secondary'
                  }>
                    {query.state.status}
                  </Badge>
                  <Badge variant="outline">
                    {query.getObserversCount()} observers
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎯 PHASE 4: CODE QUALITY & REFACTORING

### 4.1 🔧 Reusable Hooks - PLANNED

**Generic Paginated Query Hook:**

```typescript
// src/hooks/usePaginatedQuery.ts
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface UsePaginatedQueryOptions<T> {
  key: string[]
  fetchFn: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
  staleTime?: number
}

export function usePaginatedQuery<T>({
  key,
  fetchFn,
  pageSize = 20,
  staleTime = 5 * 60 * 1000,
}: UsePaginatedQueryOptions<T>) {
  const [page, setPage] = useState(1)
  
  const query = useQuery({
    queryKey: [...key, { page, pageSize }],
    queryFn: () => fetchFn(page, pageSize),
    staleTime,
  })
  
  return {
    ...query,
    page,
    setPage,
    hasNextPage: query.data?.length === pageSize,
    hasPrevPage: page > 1,
    goToNext: () => setPage(p => p + 1),
    goToPrev: () => setPage(p => Math.max(1, p - 1)),
    goToPage: (newPage: number) => setPage(newPage),
  }
}
```

**Usage:**

```typescript
const {
  data: students,
  page,
  goToNext,
  goToPrev,
  hasNextPage,
  isLoading,
} = usePaginatedQuery({
  key: ['students'],
  fetchFn: (page, pageSize) => fetchStudents(page, pageSize),
  pageSize: 20,
})
```

---

### 4.2 📐 Type Safety Enhancement - PLANNED

**Centralized Types:**

```typescript
// src/types/index.ts - Enhanced

// Role types
export type UserRole = 'admin' | 'manager' | 'counselor' | 'processor' | 'student'

// Permission types
export type Permission = 
  | 'students:view'
  | 'students:create'
  | 'students:edit'
  | 'students:delete'
  | 'documents:view'
  | 'documents:upload'
  | 'analytics:view'
  | 'users:manage'
  | 'settings:manage'

// Role-permission map
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'students:view', 'students:create', 'students:edit', 'students:delete',
    'documents:view', 'documents:upload', 'analytics:view',
    'users:manage', 'settings:manage'
  ],
  manager: [
    'students:view', 'students:create', 'students:edit',
    'documents:view', 'documents:upload', 'analytics:view'
  ],
  counselor: ['students:view', 'students:edit', 'documents:view'],
  processor: ['documents:view', 'documents:upload'],
  student: ['students:view'],
}

// Type guards
export function isValidRole(role: string): role is UserRole {
  return ['admin', 'manager', 'counselor', 'processor', 'student'].includes(role)
}

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// Database types (auto-generated from Supabase)
export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          full_name: string
          email: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
  }
}
```

**Type-Safe API Calls:**

```typescript
// src/lib/supabase/typesafe.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Now all queries are type-safe!
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('status', 'active')
// TypeScript knows the shape of `data`
```

---

### 4.3 🧩 Component Modularization - PLANNED

**Before: Monolithic Component**

```tsx
// StudentDetailModal.tsx - 500+ lines ❌
export function StudentDetailModal({ studentId }) {
  // Fetch student
  // Fetch documents
  // Fetch notes
  // Handle updates
  // Render tabs
  // Render forms
  // ... everything in one component
}
```

**After: Composable Components**

```tsx
// StudentDetailModal.tsx - Orchestration only ✅
export function StudentDetailModal({ studentId }) {
  const { student } = useStudent(studentId)
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <Dialog>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{student?.full_name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <StudentOverview studentId={studentId} />
          </TabsContent>
          
          <TabsContent value="documents">
            <StudentDocuments studentId={studentId} />
          </TabsContent>
          
          <TabsContent value="notes">
            <StudentNotes studentId={studentId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// StudentOverview.tsx - Single responsibility ✅
function StudentOverview({ studentId }: { studentId: string }) {
  const { student } = useStudent(studentId)
  
  return (
    <div className="space-y-4">
      <StudentInfoCard student={student} />
      <StudentStatsCard studentId={studentId} />
      <RecentActivityFeed studentId={studentId} />
    </div>
  )
}

// StudentDocuments.tsx - Reusable ✅
function StudentDocuments({ studentId }: { studentId: string }) {
  const { documents } = useStudentDocuments(studentId)
  
  return (
    <div className="space-y-2">
      {documents?.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  )
}
```

---

### 4.4 🛡️ Comprehensive Error Handling - PLANNED

**Centralized Error Classes:**

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

// Error handler utility
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error)
  
  if (error.code === 'PGRST116') {
    throw new AppError('Không tìm thấy dữ liệu', 'NOT_FOUND', 404)
  }
  
  if (error.code === '23505') {
    throw new AppError('Dữ liệu đã tồn tại', 'DUPLICATE_ENTRY', 409)
  }
  
  if (error.code === '42501') {
    throw new UnauthorizedError('Không có quyền truy cập')
  }
  
  if (error.message?.includes('network')) {
    throw new NetworkError()
  }
  
  throw new AppError(
    error.message || 'Đã xảy ra lỗi',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  )
}
```

**Usage:**

```typescript
// In hooks
export async function fetchStudent(id: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) handleSupabaseError(error)
    return data
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Failed to fetch student', 'FETCH_ERROR', 500)
  }
}
```

---

### 4.5 ✅ Testing - PLANNED

**Installation:**

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**Test Example:**

```typescript
// __tests__/hooks/useStudents.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStudents } from '@/hooks/useStudents'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useStudents', () => {
  it('should fetch students successfully', async () => {
    const { result } = renderHook(() => useStudents(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })
  
  it('should handle fetch error', async () => {
    const { result } = renderHook(() => useStudents(), {
      wrapper: createWrapper(),
    })
    
    await waitFor(() => {
      expect(result.current.isError).toBe(false) // Adjust based on mock
    })
  })
})
```

**Mock Setup:**

```typescript
// __mocks__/supabase.ts
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
  auth: {
    getSession: jest.fn(() => ({
      data: { session: null },
      error: null,
    })),
  },
}))
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 2: Performance (Week 3-4)
- [x] 2.1 Optimistic Updates - **DONE**
- [ ] 2.2 Prefetching - Implement `usePrefetch` hook
- [ ] 2.3 Infinite Queries - Convert StudentTable
- [ ] 2.4 Search Caching - Enhance existing implementation
- [ ] 2.5 Bundle Optimization - Add dynamic imports

### Phase 3: Monitoring (Week 5-6)
- [ ] 3.1 Sentry Integration - Setup error tracking
- [ ] 3.2 React Query DevTools - Enable in dev
- [ ] 3.3 Performance Monitoring - Core Web Vitals
- [ ] 3.4 Custom Logging - Create `useLogger`
- [ ] 3.5 Query Dashboard - Build internal tool

### Phase 4: Code Quality (Week 7-8)
- [ ] 4.1 Reusable Hooks - Extract `usePaginatedQuery`
- [ ] 4.2 Type Safety - Centralize types
- [ ] 4.3 Modularization - Refactor large components
- [ ] 4.4 Error Handling - Implement error classes
- [ ] 4.5 Testing - Write integration tests

---

## 🎯 NEXT STEPS

1. **Immediate (This Week):**
   - Implement prefetching utilities
   - Test optimistic updates in production
   - Add bundle analysis

2. **Short-term (Next 2 Weeks):**
   - Setup Sentry integration
   - Enable React Query DevTools
   - Convert StudentTable to infinite scroll

3. **Medium-term (Month 2):**
   - Extract reusable hooks
   - Improve type safety
   - Write comprehensive tests

---

**Last Updated:** 2026-04-04  
**Maintained By:** Engineering Team
