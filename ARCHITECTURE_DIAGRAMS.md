# 🏗️ KIẾN TRÚC HỆ THỐNG KEN-AI

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js App)                      │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pages      │    │ Components   │    │   Layouts    │  │
│  │  (Routes)    │    │   (UI)       │    │  (Shell)     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                    │           │
│         └───────────────────┼────────────────────┘           │
│                             │                                │
│                  ┌──────────▼──────────┐                     │
│                  │   Custom Hooks      │                     │
│                  │  (Business Logic)   │                     │
│                  └──────────┬──────────┘                     │
│                             │                                │
│              ┌──────────────┼──────────────┐                │
│              │              │              │                 │
│     ┌────────▼──────┐ ┌────▼──────┐ ┌────▼────────┐       │
│     │  React Query  │ │  Zustand  │ │ Local State │       │
│     │ (Server State)│ │(Client St)│ │  (useState) │       │
│     └────────┬──────┘ └───────────┘ └─────────────┘       │
│              │                                              │
│     ┌────────▼──────────┐                                  │
│     │  Supabase Client  │                                  │
│     │  (Auth + DB)      │                                  │
│     └────────┬──────────┘                                  │
└──────────────┼─────────────────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Supabase Backend   │
    │  - Auth (JWT)        │
    │  - PostgreSQL        │
    │  - Realtime (WS)     │
    │  - Edge Functions    │
    │  - Storage (S3)      │
    └─────────────────────┘
```

---

## 2. State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYERS                    │
└──────────────────────────────────────────────────────────────┘

Layer 1: Server State (React Query)
═══════════════════════════════════════
Data từ server, cần caching & synchronization

┌─────────────────────────────────────────────────┐
│            React Query Cache                     │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ user-profile│  │user-permis.. │  (10 min)    │
│  │ stale: 10m  │  │ stale: 5m    │              │
│  └─────────────┘  └──────────────┘              │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐              │
│  │  students   │  │  documents   │  (5 min)     │
│  │ stale: 5m   │  │ stale: 5m    │              │
│  └─────────────┘  └──────────────┘              │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐              │
│  │  analytics  │  │  knowledge   │  (5 min)     │
│  │ stale: 5m   │  │ stale: 5m    │              │
│  └─────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
                    ↑
                    │ useQuery / useMutation
                    │
Features:          │
- Automatic caching              │
- Background refetch             │
- Request deduplication          │
- Optimistic updates             │
- Retry with backoff             │

───────────────────────────────────────────────────

Layer 2: Client State (Zustand)
═══════════════════════════════════════
UI preferences, không cần server sync

┌─────────────────────────────────────────────────┐
│            Zustand Stores                        │
│                                                   │
│  ┌─────────────────────────────────────┐        │
│  │  useUserStore (persisted)           │        │
│  │  - language: 'en' | 'vi'            │        │
│  │  - timezone: 'UTC'                  │        │
│  │  - notifications: { email, push }   │        │
│  └─────────────────────────────────────┘        │
│                                                   │
│  ┌─────────────────────────────────────┐        │
│  │  useThemeStore (persisted)          │        │
│  │  - theme: 'light' | 'dark'          │        │
│  │  - systemTheme: boolean             │        │
│  └─────────────────────────────────────┘        │
│                                                   │
│  ┌─────────────────────────────────────┐        │
│  │  useSidebarStore                    │        │
│  │  - isOpen: boolean                  │        │
│  │  - isCollapsed: boolean             │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘

Features:
- Persistent (localStorage)
- No server sync needed
- Fast access
- Simple API

───────────────────────────────────────────────────

Layer 3: Local Component State
═══════════════════════════════════════
Temporary UI state, form inputs

┌─────────────────────────────────────────────────┐
│         useState / useReducer                    │
│                                                   │
│  - Form inputs                                   │
│  - Modal open/close                              │
│  - Tab selection                                 │
│  - Temporary filters                             │
│  - Loading states (local)                        │
└─────────────────────────────────────────────────┘
```

---

## 3. Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

Step 1: Initial Load
══════════════════════

┌─────────────┐
│  App Start  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ useAuth() mounted    │
└──────┬───────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────────┐              ┌──────────────────────┐
│ Get Session      │              │ useAuthSession()     │
│ (Supabase Auth)  │              │ (Token management)   │
└──────┬───────────┘              └──────────┬───────────┘
       │                                     │
       │ Session valid?                      │ Check every 2 min
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌─────────────────┐
│ setAuthUser  │◄──────────────────│ Auto-refresh     │
│ (local state)│   TOKEN_REFRESHED │ token if <5min   │
└──────┬───────┘                    └─────────────────┘
       │
       │ userId available
       ▼
┌──────────────────────────────────┐
│ useUserData(userId)              │
│ (React Query - cached)           │
│                                   │
│  - Fetch profile (if not cached) │
│  - Fetch permissions (if needed) │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ useUserProfileSubscription()     │
│ (Real-time updates)              │
│                                   │
│  - Listen to profile changes     │
│  - Invalidate cache on update    │
│  - Handle deactivation/role change│
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ useNetworkStatus()               │
│ (Network monitoring)             │
│                                   │
│  - Detect online/offline         │
│  - Refetch on reconnect          │
└──────────────────────────────────┘


Step 2: Token Lifecycle
════════════════════════

┌──────────────────────────────────────────────────────┐
│              Token Expiration Handling                │
│                                                       │
│  t=0      t=2min    t=4min    t=6min    t=8min      │
│  │         │         │         │         │           │
│  ├─Check──►├─Check──►├─Check──►├─Refresh─┤           │
│  │         │         │         │ (<5min) │           │
│  │         │         │         │         │           │
│  └─────────┴─────────┴─────────┴─────────┴─►Expire   │
│                                                       │
│  If refresh fails → Clear cache → Redirect to login  │
└──────────────────────────────────────────────────────┘


Step 3: Real-Time Updates
══════════════════════════

┌──────────────┐
│ Admin updates│
│ user role    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ PostgreSQL UPDATE│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Supabase Realtime│
│ (WebSocket)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Client receives event            │
│                                   │
│  1. Optimistic cache update      │
│     queryClient.setQueryData()   │
│                                   │
│  2. Background refetch           │
│     queryClient.invalidateQueries│
│                                   │
│  3. Show toast notification      │
│                                   │
│  4. Refresh page if role changed │
└──────────────────────────────────┘
```

---

## 4. Data Fetching Patterns

### Pattern A: Basic Query with Caching

```typescript
// Hook definition
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
    retry: 2,
  })
}

// Usage in component
function ProfileCard() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useUserProfile(user?.id)
  
  if (isLoading) return <Skeleton />
  return <div>{profile?.full_name}</div>
}
```

**Flow:**
```
Component mount
    ↓
Check cache for ['user-profile', userId]
    ↓
┌─────────────┬──────────────┐
│ Cache HIT   │  Cache MISS  │
│ (fresh)     │  (or stale)  │
└──────┬──────┴──────┬───────┘
       │             │
       │             ▼
       │      Fetch from Supabase
       │             │
       │             ▼
       │      Update cache
       │             │
       └──────┬──────┘
              │
              ▼
       Return data to component
```

### Pattern B: Mutation with Optimistic Update

```typescript
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updated } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      return updated
    },
    
    // Optimistic update (before server confirms)
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['students'] })
      
      const previousStudents = queryClient.getQueryData(['students'])
      
      queryClient.setQueryData(['students'], (old) => 
        old.map(s => s.id === id ? { ...s, ...data } : s)
      )
      
      return { previousStudents }
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['students'], context?.previousStudents)
      toast.error('Update failed')
    },
    
    // Refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
```

**Flow:**
```
User clicks "Save"
    ↓
onMutate fires
    ↓
Optimistically update cache
    ↓
Show success immediately (0ms latency)
    ↓
Send request to server
    ↓
┌─────────────┬──────────────┐
│ Success     │  Error       │
└──────┬──────┴──────┬───────┘
       │             │
       ▼             ▼
Invalidate cache  Rollback to
& refetch        previous state
                       │
                       ▼
                 Show error toast
```

### Pattern C: Infinite Query for Pagination

```typescript
export function useInfiniteStudents(filters) {
  return useInfiniteQuery({
    queryKey: ['students-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 20
      const { data } = await supabase
        .from('students')
        .select('*')
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })
      
      return {
        students: data,
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  })
}
```

**Flow:**
```
Initial load (page 0)
    ↓
Fetch students 0-19
    ↓
Cache: { pages: [page0], pageParams: [0] }
    ↓
User scrolls down
    ↓
fetchNextPage() called
    ↓
Fetch students 20-39
    ↓
Cache: { pages: [page0, page1], pageParams: [0, 1] }
    ↓
Repeat...
```

---

## 5. Real-Time Subscription Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              REAL-TIME SUBSCRIPTION FLOW                     │
└──────────────────────────────────────────────────────────────┘

Connection Lifecycle:
══════════════════════

t=0: Initial Connection
┌──────────────┐
│ Component    │
│ mounts       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Create Supabase      │
│ Channel              │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Subscribe to         │
│ postgres_changes     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Status: CONNECTING   │
└──────┬───────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
 Connected       Error/Timeout
       │              │
       │              ▼
       │      ┌──────────────┐
       │      │ Retry with   │
       │      │ backoff      │
       │      └──────┬───────┘
       │             │
       │      ┌──────▼────────┐
       │      │ Attempt 1: 1s │
       │      │ Attempt 2: 2s │
       │      │ Attempt 3: 4s │
       │      │ Attempt 4: 8s │
       │      │ Attempt 5: 16s│
       │      └──────┬────────┘
       │             │
       │      Max retries reached?
       │             │
       │      ┌──────▼────────┐
       │      │ Show error    │
       │      │ toast + reload│
       │      └───────────────┘
       │
       ▼
Status: CONNECTED
       │
       │ Listening for events...
       │
       ▼
Event Received
┌──────────────────────────────────┐
│ 1. Parse payload                 │
│                                   │
│ 2. Optimistic cache update       │
│    queryClient.setQueryData()    │
│    (Immediate UI update)         │
│                                   │
│ 3. Invalidate queries            │
│    (Background refetch)          │
│                                   │
│ 4. Handle special cases:         │
│    - Account deactivated?        │
│    - Role changed?               │
│                                   │
│ 5. Show toast notification       │
└──────────────────────────────────┘


Exponential Backoff Algorithm:
═══════════════════════════════

function calculateDelay(attempt, baseDelay, maxDelay) {
  return Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  )
}

// Example:
// Attempt 0: 1000ms * 2^0 = 1000ms  (1s)
// Attempt 1: 1000ms * 2^1 = 2000ms  (2s)
// Attempt 2: 1000ms * 2^2 = 4000ms  (4s)
// Attempt 3: 1000ms * 2^3 = 8000ms  (8s)
// Attempt 4: 1000ms * 2^4 = 16000ms (16s)
// Attempt 5: capped at 30000ms       (30s)
```

---

## 6. Error Handling Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING LAYERS                       │
└──────────────────────────────────────────────────────────────┘

Layer 1: Query/Mutation Level
══════════════════════════════

useQuery({
  queryFn: async () => {
    try {
      const { data, error } = await supabase...
      if (error) throw error
      return data
    } catch (err) {
      // Log error
      console.error('Query failed:', err)
      
      // Re-throw for React Query to handle
      throw err
    }
  },
  retry: (failureCount, error) => {
    // Don't retry client errors (4xx)
    if (error?.status >= 400 && error?.status < 500) return false
    return failureCount < 2
  },
  onError: (error) => {
    // Show toast for this specific query
    toast.error('Failed to load data')
  }
})


Layer 2: Component Level (Error Boundary)
══════════════════════════════════════════

<QueryErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Log to Sentry
    Sentry.captureException(error, { contexts: { react: errorInfo } })
  }}
>
  <YourComponent />
</QueryErrorBoundary>


Layer 3: Global Level (ReactQueryProvider)
══════════════════════════════════════════

// Smart retry logic (no global onError in v5)
new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 2
      },
      networkMode: 'online', // Don't fetch when offline
    },
    mutations: {
      retry: 1,
      networkMode: 'always', // Always try mutations
    }
  }
})


Error Classification:
══════════════════════

┌──────────────────┬──────────────┬────────────────────────┐
│ Error Type       │ Retry?       │ User Action            │
├──────────────────┼──────────────┼────────────────────────┤
│ Network Error    │ Yes (2x)     │ Auto-retry, show toast │
│ 404 Not Found    │ No           │ Show "not found" UI    │
│ 403 Forbidden    │ No           │ Redirect to 403 page   │
│ 500 Server Error │ Yes (2x)     │ Show error, retry btn  │
│ Token Expired    │ No           │ Auto-refresh token     │
│ Validation Error │ No           │ Show form errors       │
└──────────────────┴──────────────┴────────────────────────┘
```

---

## 7. Performance Optimization Checklist

```
┌──────────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATION MATRIX                 │
└──────────────────────────────────────────────────────────────┘

Caching Strategy:
══════════════════

Data Type          | Stale Time | GC Time  | Strategy
-------------------|------------|----------|------------------
User Profile       | 10 min     | 30 min   | Long cache, rare changes
Permissions        | 5 min      | 15 min   | Moderate cache
Students List      | 5 min      | 10 min   | Moderate cache
Documents          | 5 min      | 10 min   | Moderate cache
Analytics          | 5 min      | 10 min   | Moderate cache
Search Results     | 2 min      | 5 min    | Short cache, frequent changes
Knowledge Articles | 5 min      | 10 min   | Moderate cache


Rendering Optimization:
════════════════════════

✓ React.memo for pure components
✓ useMemo for expensive calculations
✓ useCallback for event handlers passed as props
✓ Code splitting for routes (Next.js automatic)
✓ Dynamic imports for heavy components (charts, editors)
✓ Virtual scrolling for large lists (>100 items)


Network Optimization:
══════════════════════

✓ Request deduplication (React Query automatic)
✓ Parallel queries instead of waterfall
✓ Prefetching for predicted user actions
✓ Debounced search (300ms delay)
✓ Pagination instead of loading all data
✓ Infinite scroll for better UX


Bundle Optimization:
════════════════════

✓ Tree shaking (automatic with ES modules)
✓ Package-level code splitting (lucide-react, recharts)
✓ Lazy loading for non-critical routes
✓ Image optimization (Next.js Image component)
✓ Font optimization (next/font)
```

---

## 8. Monitoring & Observability

```
┌──────────────────────────────────────────────────────────────┐
│                 MONITORING STACK                             │
└──────────────────────────────────────────────────────────────┘

Development:
════════════

1. React Query DevTools
   - Inspect cache
   - Manual refetch/invalidate
   - View query timing
   
2. Browser DevTools
   - Network tab (API calls)
   - Performance tab (rendering)
   - Console (logs)

3. Custom Logging Hook
   ```typescript
   const { log } = useLogger('ComponentName')
   log('Data loaded', data.length)
   ```


Production:
═══════════

1. Error Tracking (Sentry)
   - Capture unhandled errors
   - Track error frequency
   - User context (who, when, where)
   
2. Session Replay (LogRocket)
   - Record user sessions
   - Replay bugs
   - Performance metrics
   
3. Performance Monitoring
   - Core Web Vitals
   - Query performance
   - Page load times
   
4. Custom Metrics
   - API response times
   - Cache hit rates
   - Real-time connection status
```

---

## 9. Security Considerations

```
┌──────────────────────────────────────────────────────────────┐
│                  SECURITY ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────┘

Authentication:
═══════════════

✓ JWT tokens (Supabase Auth)
✓ Auto-refresh before expiration (5 min buffer)
✓ Secure httpOnly cookies (if configured)
✓ Session validation on every request

Authorization:
══════════════

✓ Row Level Security (RLS) in PostgreSQL
✓ Permission-based access control
✓ Role hierarchy (admin > manager > counselor > processor > student)
✓ Server-side permission checks (Edge Functions)

Data Protection:
════════════════

✓ Encrypted at rest (Supabase managed)
✓ Encrypted in transit (HTTPS/TLS)
✓ Sensitive data never logged
✓ Input sanitization (prevent XSS)

Real-Time Security:
═══════════════════

✓ Channel-level authorization
✓ Filter by user ID (only see own data)
✓ Automatic cleanup on logout
✓ Rate limiting on subscriptions
```

---

## 10. Scalability Roadmap

```
┌──────────────────────────────────────────────────────────────┐
│              SCALABILITY MILESTONES                          │
└──────────────────────────────────────────────────────────────┘

Current State (0-100 users):
════════════════════════════
✓ Single Supabase project
✓ Basic caching (5-10 min)
✓ Real-time subscriptions
✓ Client-side error handling

Growth Phase (100-1000 users):
══════════════════════════════
→ Add CDN for static assets
→ Implement query result compression
→ Add Redis cache layer (optional)
→ Horizontal scaling for Edge Functions
→ Database read replicas

Scale Phase (1000-10000 users):
═══════════════════════════════
→ Multi-region deployment
→ Advanced caching strategies (CDN edge cache)
→ Message queue for background jobs
→ Database sharding (if needed)
→ Microservices architecture

Enterprise (10000+ users):
══════════════════════════
→ Dedicated infrastructure
→ Custom auth server
→ Advanced analytics pipeline
→ ML-powered optimizations
→ Global CDN with edge computing
```

---

**Last Updated:** 2026-04-04  
**Version:** 1.0  
**Maintained By:** Engineering Team
