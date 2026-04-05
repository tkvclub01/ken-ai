# 🏗️ KHUYẾN NGHỊ KIẾN TRÚC NÂNG CAO - KEN-AI APPLICATION

**Ngày tạo:** 2026-04-04  
**Tác giả:** Senior Frontend Architect  
**Phiên bản:** 1.0

---

## 📊 TỔNG QUAN KIẾN TRÚC HIỆN TẠI

### ✅ Điểm mạnh đã đạt được

1. **React Query Caching**: Đã implement caching cho user profile (10 phút) và permissions (5 phút)
2. **Real-time Subscriptions**: Supabase Realtime để lắng nghe thay đổi profile/role
3. **Network Monitoring**: Tự động refetch khi network reconnect
4. **Token Management**: `useAuthSession` xử lý token expiration chủ động
5. **Error Boundaries**: QueryErrorBoundary bắt lỗi gracefully

### ⚠️ Vấn đề còn tồn tại

1. **State Management phân mảnh**: useAuth + useUserStore + React Query → khó debug
2. **Error Handling chưa đồng bộ**: Không có global error strategy
3. **Real-time reliability**: Chưa có exponential backoff cho reconnection
4. **Performance bottlenecks**: Một số trang vẫn fetch dữ liệu không cần thiết
5. **Monitoring thiếu**: Không có client-side error tracking trong production

---

## 1. 🏛️ KIẾN TRÚC & QUẢN LÝ STATE

### 1.1. Phân tích vấn đề

**Hiện tại:**
```typescript
// useAuth.ts - Quản lý auth state + data fetching
const [authUser, setAuthUser] = useState<User | null>(null)
const { profile, permissions } = useUserData(userId) // React Query

// useUserStore.ts - Chỉ lưu UI preferences
preferences: { language, timezone, notifications }

// ReactQueryProvider.tsx - Global cache config
staleTime: 5 minutes (quá chung chung)
```

**Vấn đề:**
- ❌ `useAuth` vừa quản lý auth state (Zustand pattern) vừa dùng React Query
- ❌ Không rõ ràng: Dữ liệu nào nên ở Zustand? Dữ liệu nào nên ở React Query?
- ❌ Token expiration handling分散 ở nhiều nơi

### 1.2. Giải pháp: Kiến trúc Layered State Management

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (UI)              │
│  - Components, Pages, Layouts                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Business Logic Layer (Hooks)            │
│  - useAuth (orchestration)                   │
│  - useUserProfile (data fetching)            │
│  - useAuthSession (token management)         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────┐    ┌────────▼────────┐
│ React Query  │    │   Zustand       │
│ (Server      │    │ (Client State)  │
│  State)      │    │                 │
│ - Profile    │    │ - Preferences   │
│ - Permissions│    │ - Sidebar state │
│ - Students   │    │ - Theme         │
│ - Documents  │    └─────────────────┘
└──────────────┘
```

**Nguyên tắc:**
- ✅ **React Query**: Dữ liệu từ server (profile, permissions, students, documents)
- ✅ **Zustand**: Client-only state (UI preferences, theme, sidebar toggle)
- ✅ **Local State (useState)**: Form inputs, temporary UI state

### 1.3. Implementation: Refactor useAuth thành Orchestrator

```typescript
// src/hooks/useAuth.ts - Clean Architecture
export function useAuth() {
  const supabase = createClient()
  
  // 1. Auth session management (token lifecycle)
  const { checkSession, refreshSession, forceLogout } = useAuthSession({
    onTokenExpired: handleTokenExpired,
    onTokenRefreshed: handleTokenRefreshed,
  })
  
  // 2. Get current auth user (from Supabase Auth)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const userId = authUser?.id
  
  // 3. Fetch user data with React Query (cached)
  const { 
    data: profile, 
    data: permissions,
    isLoading: userDataLoading,
    isError: userDataError,
    refetch: refetchUserData 
  } = useUserData(userId)
  
  // 4. Real-time subscriptions
  useUserProfileSubscription(userId)
  useNetworkStatus()
  
  // 5. Permission checking helpers
  const hasPermission = useCallback(...)
  const hasRole = useCallback(...)
  
  return {
    // Auth state
    user: authUser,
    profile,
    permissions,
    loading: !authUser || userDataLoading,
    error: userDataError ? 'Failed to load user data' : null,
    isAuthenticated: !!authUser,
    
    // Actions
    signOut,
    refreshUser: refetchUserData,
    checkSession,
    refreshSession,
    forceLogout,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  }
}
```

**Lợi ích:**
- ✅ Tách biệt rõ ràng: Session management vs Data fetching vs Real-time
- ✅ Dễ test từng phần độc lập
- ✅ Dễ thay thế implementation (ví dụ: chuyển từ Supabase sang Firebase)

### 1.4. Xử lý Edge Cases

#### A. Network Flakiness (Mạng chập chờn)

```typescript
// src/hooks/useNetworkStatus.ts - Enhanced
export function useNetworkStatus() {
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCount, setRetryCount] = useState(0)
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network reconnected')
      setIsOnline(true)
      setRetryCount(0)
      
      // Refetch only active queries (không phải tất cả)
      queryClient.resumePausedMutations()
      queryClient.refetchQueries({ 
        type: 'active',
        predicate: (query) => {
          // Chỉ refetch queries quan trọng
          return ['user-profile', 'user-permissions'].some(key => 
            query.queryKey.includes(key)
          )
        }
      })
    }
    
    const handleOffline = () => {
      console.log('📴 Network disconnected')
      setIsOnline(false)
      toast.warning('Mất kết nối mạng', {
        description: 'Dữ liệu có thể không cập nhật',
        duration: 3000,
      })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])
  
  return { isOnline, retryCount }
}
```

#### B. Token Expiration Graceful Handling

Đã implement trong `useAuthSession.ts`:
- ✅ Check session mỗi 2 phút
- ✅ Refresh token trước khi hết hạn 5 phút
- ✅ Clear cache và redirect khi token hết hạn
- ✅ Lắng nghe Supabase auth events

#### C. Race Conditions Prevention

```typescript
// Problem: Multiple components call useAuth() simultaneously
// Solution: React Query tự động deduplicate requests

// useUserProfile.ts
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      // Dù 10 components gọi cùng lúc, chỉ có 1 request thực sự
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 phút
  })
}
```

---

## 2. 🔄 ĐỘ TIN CẬY REAL-TIME

### 2.1. Phân tích hiện tại

**File:** `src/hooks/useRealtimeSubscriptions.ts`

**Đã làm tốt:**
- ✅ Subscribe đến UPDATE events trên profiles table
- ✅ Invalidate cache khi có thay đổi
- ✅ Handle account deactivation và role changes
- ✅ Cleanup subscription khi unmount

**Cần cải thiện:**
- ❌ Không có exponential backoff khi connection mất
- ❌ Không handle SUBSCRIPTION_ERROR event
- ❌ Không có heartbeat/ping để detect dead connections
- ❌ UI có thể flicker khi refetch sau invalidate

### 2.2. Giải pháp: Robust Real-time Subscription

```typescript
// src/hooks/useRealtimeSubscriptions.ts - Enhanced
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UseRealtimeOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

/**
 * Real-time subscription với exponential backoff và health monitoring
 */
export function useUserProfileSubscription(
  userId: string | undefined,
  options: UseRealtimeOptions = {}
) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000,
  } = options
  
  const queryClient = useQueryClient()
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected')
  
  useEffect(() => {
    if (!userId) return
    
    const supabase = createClient()
    let retryTimeout: NodeJS.Timeout | null = null
    
    const connect = () => {
      setConnectionStatus('connecting')
      
      const channel = supabase
        .channel(`profile-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          async (payload) => {
            console.log('📡 Real-time update received:', payload)
            
            const newProfile = payload.new as any
            
            // Optimistic cache update (tránh UI flicker)
            queryClient.setQueryData(['user-profile', userId], newProfile)
            
            // Background refetch để đảm bảo consistency
            queryClient.invalidateQueries({ 
              queryKey: ['user-profile', userId],
              refetchType: 'none' // Don't refetch immediately
            })
            queryClient.invalidateQueries({ 
              queryKey: ['user-permissions', userId],
              refetchType: 'none'
            })
            
            // Handle special cases
            if (newProfile.is_active === false) {
              handleAccountDeactivated()
            } else if (newProfile.role !== payload.old?.role) {
              handleRoleChanged(newProfile.role)
            }
          }
        )
        .on('system', { event: 'connected' }, () => {
          console.log('✅ Real-time subscription connected')
          setConnectionStatus('connected')
          retryCountRef.current = 0 // Reset retry count on success
        })
        .on('system', { event: 'disconnected' }, () => {
          console.warn('⚠️ Real-time subscription disconnected')
          setConnectionStatus('disconnected')
          scheduleReconnect()
        })
        .on('system', { event: 'error' }, (error) => {
          console.error('❌ Real-time subscription error:', error)
          setConnectionStatus('error')
          scheduleReconnect()
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Channel error, scheduling reconnect...')
            scheduleReconnect()
          }
        })
      
      channelRef.current = channel
    }
    
    /**
     * Exponential backoff reconnection
     * Delay: 1s → 2s → 4s → 8s → 16s → 30s (max)
     */
    const scheduleReconnect = () => {
      if (retryCountRef.current >= maxRetries) {
        console.error('❌ Max retries reached, giving up')
        toast.error('Không thể kết nối real-time', {
          description: 'Vui lòng refresh trang',
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        })
        return
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(2, retryCountRef.current),
        maxDelay
      )
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`)
      
      retryTimeout = setTimeout(() => {
        retryCountRef.current++
        connect()
      }, delay)
    }
    
    /**
     * Handle account deactivation
     */
    const handleAccountDeactivated = () => {
      toast.error('Tài khoản đã bị vô hiệu hóa', {
        description: 'Vui lòng liên hệ quản trị viên',
        duration: 10000,
      })
      
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      }, 3000)
    }
    
    /**
     * Handle role change
     */
    const handleRoleChanged = (newRole: string) => {
      toast.info('Vai trò của bạn đã được cập nhật', {
        description: `Bạn bây giờ là ${newRole}. Trang sẽ refresh.`,
        duration: 5000,
      })
      
      setTimeout(() => {
        router.refresh()
      }, 2000)
    }
    
    // Initial connect
    connect()
    
    // Cleanup
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        console.log('🧹 Real-time subscription cleaned up')
      }
    }
  }, [userId, queryClient, router, maxRetries, baseDelay, maxDelay])
  
  return { connectionStatus }
}
```

**Cải tiến:**
- ✅ Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s
- ✅ Track connection status (connecting/connected/error/disconnected)
- ✅ Handle system events (connected/disconnected/error)
- ✅ Optimistic cache update để tránh UI flicker
- ✅ Max retries với graceful degradation

### 2.3. Preventing UI Flickering

**Problem:** Khi invalidate query, UI hiển thị loading state → flicker

**Solution 1: Optimistic Updates**
```typescript
// Khi nhận real-time update, update cache ngay lập tức
queryClient.setQueryData(['user-profile', userId], newProfile)

// Sau đó invalidate để background refetch (không block UI)
queryClient.invalidateQueries({ 
  queryKey: ['user-profile', userId],
  refetchType: 'none' // Không refetch ngay
})
```

**Solution 2: Keep Previous Data**
```typescript
// useUserProfile.ts
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: ...,
    keepPreviousData: true, // Giữ data cũ trong khi fetch data mới
    placeholderData: (previousData) => previousData, // Fallback to previous
  })
}
```

**Solution 3: Smooth Transitions**
```tsx
// Component level
const { data: profile, isFetching } = useUserProfile(userId)

return (
  <div className={cn('transition-opacity duration-200', isFetching && 'opacity-70')}>
    <h1>{profile?.full_name}</h1>
    {/* Content stays visible during refetch */}
  </div>
)
```

---

## 3. ⚡ HIỆU SUẤT & CACHING NÂNG CAO

### 3.1. Audit Performance Bottlenecks

**Các trang cần tối ưu:**

| Trang | Vấn đề | Giải pháp | Priority |
|-------|--------|-----------|----------|
| Students | Load toàn bộ students cùng lúc | Pagination + Infinite Query | 🔴 High |
| Knowledge Base | Search không debounce | Debounce + Cache search results | 🟡 Medium |
| Analytics Dashboard | 5+ queries waterfall | Parallel fetch + Cache | 🟢 Done |
| Documents | Large file uploads | Chunked upload + Progress tracking | 🟡 Medium |
| Chat | Message history không cache | Cursor-based pagination | 🔴 High |

### 3.2. Advanced Caching Strategies

#### A. Optimistic Updates (Cập nhật trước khi server confirm)

```typescript
// src/hooks/useStudents.ts
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
      const { data: updated, error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return updated
    },
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['students'] })
      
      // Snapshot previous value
      const previousStudents = queryClient.getQueryData(['students'])
      
      // Optimistically update
      queryClient.setQueryData(['students'], (old: Student[] | undefined) => {
        if (!old) return old
        return old.map(student => 
          student.id === id ? { ...student, ...data } : student
        )
      })
      
      // Return context for rollback
      return { previousStudents }
    },
    
    // If mutation fails, rollback
    onError: (err, variables, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents)
      toast.error('Cập nhật thất bại', {
        description: 'Dữ liệu đã được khôi phục',
      })
    },
    
    // Always refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
```

**UX Benefit:** User thấy thay đổi ngay lập tức (0ms latency perception)

#### B. Prefetching (Dự đoán và load trước)

```typescript
// src/components/features/students/StudentTable.tsx
export function StudentTable() {
  const queryClient = useQueryClient()
  const { data: students } = useStudents({ page: 1 })
  
  // Prefetch next page when hovering over pagination
  const handlePageHover = (nextPage: number) => {
    queryClient.prefetchQuery({
      queryKey: ['students', { page: nextPage }],
      queryFn: () => fetchStudents({ page: nextPage }),
      staleTime: 5 * 60 * 1000,
    })
  }
  
  return (
    <div>
      {/* Student list */}
      <Pagination>
        <Button 
          onMouseEnter={() => handlePageHover(currentPage + 1)}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </Button>
      </Pagination>
    </div>
  )
}
```

**Benefit:** Khi user click "Next", data đã có sẵn trong cache → instant navigation

#### C. Infinite Query cho danh sách dài

```typescript
// src/hooks/useStudents.ts
export function useInfiniteStudents(filters?: StudentFilters) {
  return useInfiniteQuery({
    queryKey: ['students-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 20
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        students: data,
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  })
}

// Usage
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteStudents({ status: 'active' })

// Render
{data?.pages.map((page) => (
  <div key={page.students[0]?.id}>
    {page.students.map(student => (
      <StudentCard key={student.id} student={student} />
    ))}
  </div>
))}

{hasNextPage && (
  <Button 
    onClick={() => fetchNextPage()}
    disabled={isFetchingNextPage}
  >
    {isFetchingNextPage ? 'Loading...' : 'Load More'}
  </Button>
)}
```

**Benefit:** Load-on-demand, giảm initial load time

#### D. Search Results Caching với Debounce

```typescript
// src/hooks/useKnowledgeSearch.ts
export function useKnowledgeSearch(query: string, delay = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [query, delay])
  
  return useQuery({
    queryKey: ['knowledge-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []
      
      const { data, error } = await supabase.rpc('search_knowledge', {
        search_query: debouncedQuery,
      })
      
      if (error) throw error
      return data
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // Cache search results for 2 minutes
    keepPreviousData: true, // Show previous results while fetching new
  })
}

// Usage
const [searchQuery, setSearchQuery] = useState('')
const { data: results, isFetching } = useKnowledgeSearch(searchQuery)

<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search knowledge base..."
/>

{isFetching && <Spinner />}
{results?.map(article => <ArticleCard key={article.id} article={article} />)}
```

### 3.3. Bundle Optimization

```typescript
// next.config.ts - Code splitting optimization
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Dynamic imports cho heavy components
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        charts: {
          test: /[\\/]recharts[\\/]/,
          name: 'charts',
          chunks: 'all',
        },
        editor: {
          test: /[\\/]@tiptap[\\/]/,
          name: 'editor',
          chunks: 'all',
        },
      },
    }
    return config
  },
}
```

---

## 4. 🎯 CODE QUALITY & BEST PRACTICES

### 4.1. Custom Hook Abstractions

**Problem:** Logic lặp lại trong nhiều components

**Solution: Extract reusable hooks**

```typescript
// src/hooks/usePaginatedQuery.ts - Generic pagination hook
export function usePaginatedQuery<T>(
  key: string[],
  fetchFn: (page: number) => Promise<T[]>,
  options?: {
    pageSize?: number
    staleTime?: number
  }
) {
  const [page, setPage] = useState(1)
  const { pageSize = 20, staleTime = 5 * 60 * 1000 } = options || {}
  
  const query = useQuery({
    queryKey: [...key, { page, pageSize }],
    queryFn: () => fetchFn(page),
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
  }
}

// Usage
const { 
  data: students, 
  page, 
  setPage, 
  hasNextPage,
  goToNext,
  goToPrev,
} = usePaginatedQuery(
  ['students'],
  (page) => fetchStudents(page),
  { pageSize: 20 }
)
```

### 4.2. Type Safety Enhancements

```typescript
// src/types/auth.ts - Centralized type definitions
export type UserRole = 'admin' | 'manager' | 'counselor' | 'processor' | 'student'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

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

// Type guard
export function isValidRole(role: string): role is UserRole {
  return ['admin', 'manager', 'counselor', 'processor', 'student'].includes(role)
}

// Permission map by role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['students:view', 'students:create', 'students:edit', 'students:delete', 
          'documents:view', 'documents:upload', 'analytics:view', 'users:manage', 
          'settings:manage'],
  manager: ['students:view', 'students:create', 'students:edit', 
            'documents:view', 'documents:upload', 'analytics:view'],
  counselor: ['students:view', 'students:edit', 'documents:view'],
  processor: ['documents:view', 'documents:upload'],
  student: ['students:view'],
}
```

### 4.3. Component Modularization

**Before: Monolithic Component**
```tsx
// StudentDetailModal.tsx - 500+ lines
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
// StudentDetailModal.tsx - Orchestration only
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
            <StudentOverview student={student} />
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

// StudentOverview.tsx - Single responsibility
function StudentOverview({ student }: { student: Student }) {
  return (
    <div className="space-y-4">
      <StudentInfoCard student={student} />
      <StudentStatsCard studentId={student.id} />
      <RecentActivityFeed studentId={student.id} />
    </div>
  )
}
```

**Benefits:**
- ✅ Mỗi component < 150 lines
- ✅ Dễ test unit
- ✅ Reusable trong contexts khác
- ✅ Parallel development

### 4.4. Error Handling Patterns

```typescript
// src/lib/errors.ts - Centralized error handling
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

export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error)
  
  if (error.code === 'PGRST116') {
    throw new AppError('Không tìm thấy dữ liệu', 'NOT_FOUND', 404)
  }
  
  if (error.code === '23505') {
    throw new AppError('Dữ liệu đã tồn tại', 'DUPLICATE_ENTRY', 409)
  }
  
  if (error.code === '42501') {
    throw new AppError('Không có quyền truy cập', 'UNAUTHORIZED', 403)
  }
  
  throw new AppError(
    error.message || 'Đã xảy ra lỗi',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  )
}

// Usage in hooks
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

## 5. 📊 MONITORING & DEBUGGING

### 5.1. Client-Side Error Tracking

#### Option A: Sentry (Recommended for Production)

```bash
npm install @sentry/nextjs
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

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
    // Don't send errors from extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(frame => 
      frame.filename?.includes('chrome-extension://')
    )) {
      return null
    }
    return event
  },
})

// Wrap QueryErrorBoundary
export class QueryErrorBoundary extends Component<Props, State> {
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
      },
    })
    
    this.props.onError?.(error, errorInfo)
  }
}
```

#### Option B: LogRocket (Session Replay)

```typescript
// src/lib/logrocket.ts
import LogRocket from 'logrocket'

if (process.env.NODE_ENV === 'production') {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID!)
  
  // Identify users
  LogRocket.identify(user.id, {
    email: user.email,
    role: user.profile?.role,
  })
}
```

### 5.2. React Query DevTools

```typescript
// src/hooks/ReactQueryProvider.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function ReactQueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({...}))
  
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
- ✅ Xem tất cả queries đang active
- ✅ Inspect cache data
- ✅ Manual refetch/invalidate
- ✅ Xem query timing

### 5.3. Performance Monitoring

```typescript
// src/lib/performance.ts
export function measureRenderTime(componentName: string, fn: () => void) {
  if (process.env.NODE_ENV !== 'development') return
  
  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start
  
  if (duration > 16) { // More than 1 frame (60fps)
    console.warn(`⚠️ ${componentName} took ${duration.toFixed(2)}ms to render`)
  }
}

// Usage
measureRenderTime('StudentTable', () => {
  ReactDOM.render(<StudentTable />, container)
})
```

### 5.4. Custom Logging Hook

```typescript
// src/hooks/useLogger.ts
export function useLogger(componentName: string) {
  useEffect(() => {
    console.log(`📦 ${componentName} mounted`)
    
    return () => {
      console.log(`🗑️ ${componentName} unmounted`)
    }
  }, [componentName])
  
  const log = useCallback((message: string, data?: any) => {
    console.log(`[${componentName}] ${message}`, data || '')
  }, [componentName])
  
  return { log }
}

// Usage
export function StudentTable() {
  const { log } = useLogger('StudentTable')
  
  useEffect(() => {
    log('Students loaded', students?.length)
  }, [students, log])
  
  return <div>...</div>
}
```

---

## 📈 ROADMAP TRIỂN KHAI

### Phase 1: Critical Fixes (Week 1-2) 🔴
- [ ] Fix ReactQueryProvider error handlers (DONE ✅)
- [ ] Implement useAuthSession (DONE ✅)
- [ ] Add QueryErrorBoundary to root layout (DONE ✅)
- [ ] Enhance real-time subscription with exponential backoff
- [ ] Add network status monitoring with graceful degradation

### Phase 2: Performance Optimization (Week 3-4) 🟡
- [ ] Implement optimistic updates for mutations
- [ ] Add prefetching for pagination
- [ ] Convert large lists to infinite queries
- [ ] Add search result caching with debounce
- [ ] Optimize bundle size with code splitting

### Phase 3: Monitoring & Observability (Week 5-6) 🟢
- [ ] Integrate Sentry for error tracking
- [ ] Add React Query DevTools
- [ ] Setup performance monitoring
- [ ] Add custom logging hooks
- [ ] Create dashboard for query performance metrics

### Phase 4: Code Quality & Refactoring (Week 7-8) 🔵
- [ ] Extract reusable hooks (usePaginatedQuery, etc.)
- [ ] Improve type safety with centralized types
- [ ] Modularize large components
- [ ] Add comprehensive error handling
- [ ] Write integration tests for critical flows

---

## 🎓 BEST PRACTICES CHECKLIST

### State Management
- [ ] Server state → React Query
- [ ] Client state → Zustand
- [ ] Local UI state → useState/useReducer
- [ ] No prop drilling beyond 2 levels

### Data Fetching
- [ ] All queries have appropriate staleTime
- [ ] Mutations invalidate related queries
- [ ] Error boundaries wrap query-dependent components
- [ ] Loading states are skeleton screens, not spinners

### Real-Time
- [ ] Subscriptions cleanup on unmount
- [ ] Exponential backoff for reconnections
- [ ] Optimistic updates to prevent flickering
- [ ] Connection status exposed to UI

### Performance
- [ ] React.memo for pure components
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers passed as props
- [ ] Code splitting for routes and heavy components

### Error Handling
- [ ] All async operations wrapped in try-catch
- [ ] User-friendly error messages
- [ ] Error logging to monitoring service
- [ ] Graceful degradation (show cached data if available)

### Testing
- [ ] Unit tests for hooks (React Testing Library)
- [ ] Integration tests for critical user flows
- [ ] E2E tests for authentication and RBAC
- [ ] Performance regression tests

---

## 📚 TÀI LIỆU THAM KHẢO

1. **React Query Best Practices**: https://tanstack.com/query/latest/docs/framework/react/guides/best-practices
2. **Supabase Realtime**: https://supabase.com/docs/guides/realtime
3. **Next.js Performance**: https://nextjs.org/docs/app/building-your-application/optimizing
4. **Zustand Patterns**: https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions
5. **Error Boundaries**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

---

## 💡 KẾT LUẬN

Kiến trúc hiện tại của Ken-AI đã có nền tảng vững chắc với React Query caching và real-time subscriptions. Các khuyến nghị trên tập trung vào:

1. **Stability**: Error boundaries, graceful degradation, robust reconnection
2. **Scalability**: Modular components, reusable hooks, type safety
3. **Maintainability**: Clear separation of concerns, comprehensive logging, monitoring

**Ưu tiên triển khai theo thứ tự:**
1. Fix error handling và session management (Phase 1)
2. Optimize performance bottlenecks (Phase 2)
3. Add monitoring và observability (Phase 3)
4. Refactor và improve code quality (Phase 4)

Với roadmap này, Ken-AI sẽ có kiến trúc enterprise-grade, dễ maintain và scale khi user base tăng trưởng.

---

**Người review:** [Tên Senior Architect]  
**Ngày review:** 2026-04-04  
**Status:** Draft - Cần feedback từ team
