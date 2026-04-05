# 📦 HƯỚNG DẪN BUNDLE OPTIMIZATION & CODE SPLITTING

**Ngày:** 2026-04-04  
**Phase:** 2.5 - Bundle Optimization

---

## 🎯 TỔNG QUAN

Bundle optimization giúp giảm kích thước JavaScript bundle, cải thiện:
- ⚡ **Initial load time** - Tải trang nhanh hơn
- 📱 **Mobile performance** - Tốt hơn trên thiết bị di động
- 💾 **Bandwidth usage** - Tiết kiệm băng thông
- 🎨 **User experience** - Trải nghiệm mượt mà hơn

---

## 🔧 BUNDLE ANALYZER SETUP

### ✅ Đã Cài Đặt

**Package:** `@next/bundle-analyzer`  
**Config:** `next.config.ts` đã được cập nhật

### Cách Sử Dụng

#### 1. Chạy Bundle Analysis

```bash
# Build với analyzer
ANALYZE=true npm run build
```

#### 2. Xem Kết Quả

Sau khi build xong, trình duyệt sẽ tự động mở 3 tabs:
- **client.html** - Client-side bundles
- **server.html** - Server-side bundles  
- **edge.html** - Edge runtime bundles

#### 3. Phân Tích

Trong giao diện analyzer:
- 🔍 Tìm các chunks lớn nhất
- 📊 Xem dependency tree
- 🎯 Identify code duplication
- 💡 Tìm optimization opportunities

---

## 🚀 DYNAMIC IMPORTS

### 1. Lazy Load Heavy Components

#### Before (Eager Loading)
```typescript
import { RichTextEditor } from '@/components/features/ai/RichTextEditor'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'

export default function Page() {
  return (
    <div>
      <RichTextEditor />
      <AnalyticsDashboard />
    </div>
  )
}
```

#### After (Lazy Loading)
```typescript
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load với loading state
const RichTextEditor = dynamic(
  () => import('@/components/features/ai/RichTextEditor'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false, // Disable SSR nếu không cần
  }
)

const AnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard'),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  }
)

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <RichTextEditor />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
```

**Benefits:**
- ✅ Component chỉ load khi cần
- ✅ Giảm initial bundle size
- ✅ Better perceived performance

---

### 2. Route-Based Code Splitting

Next.js tự động code-split theo routes, nhưng có thể optimize thêm:

#### Example: Admin Routes

```typescript
// src/app/(dashboard)/admin/page.tsx
import dynamic from 'next/dynamic'

// Chỉ load khi user vào /admin
const UserManagementTable = dynamic(
  () => import('@/components/admin/UserManagementTable'),
  { loading: () => <UserTableSkeleton /> }
)

const AuditLogViewer = dynamic(
  () => import('@/components/admin/AuditLogViewer'),
  { loading: () => <AuditLogSkeleton /> }
)

export default function AdminPage() {
  return (
    <div>
      <UserManagementTable />
      <AuditLogViewer />
    </div>
  )
}
```

---

### 3. Conditional Lazy Loading

Load components based on conditions:

```typescript
import dynamic from 'next/dynamic'
import { useState } from 'react'

const ChartComponent = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { loading: () => <ChartSkeleton /> }
)

export function Dashboard() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Revenue Chart
      </button>
      
      {showChart && <ChartComponent />}
    </div>
  )
}
```

---

### 4. Prefetching với Dynamic Imports

```typescript
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <Skeleton /> }
)

export function Page() {
  // Prefetch khi component mount
  useEffect(() => {
    import('@/components/HeavyComponent') // Preload
  }, [])

  return <HeavyComponent />
}
```

---

## 📊 OPTIMIZATION STRATEGIES

### 1. Identify Large Dependencies

Chạy bundle analyzer và tìm:
- ❌ Libraries > 100KB
- ❌ Duplicate dependencies
- ❌ Unused imports
- ❌ Large images/fonts

### 2. Replace Heavy Libraries

#### Example: Replace moment.js with date-fns

```typescript
// ❌ BAD - moment.js is 300KB+
import moment from 'moment'
moment().format('YYYY-MM-DD')

// ✅ GOOD - date-fns is tree-shakeable
import { format } from 'date-fns'
format(new Date(), 'yyyy-MM-dd')
```

#### Example: Use lightweight alternatives

```typescript
// ❌ BAD - lodash is 70KB+
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ GOOD - Just import what you need
import debounce from 'lodash/debounce'
debounce(fn, 300)

// ✅ BETTER - Custom implementation
function debounce(fn: Function, delay: number) {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

---

### 3. Tree Shaking

Ensure your imports are tree-shakeable:

```typescript
// ❌ BAD - Imports entire library
import { Button, Card, Dialog } from '@radix-ui/react'

// ✅ GOOD - Import individual components
import { Button } from '@radix-ui/react-button'
import { Card } from '@radix-ui/react-card'
import { Dialog } from '@radix-ui/react-dialog'
```

---

### 4. Image Optimization

```typescript
import Image from 'next/image'

// ✅ Next.js optimizes automatically
<Image
  src="/student-photo.jpg"
  alt="Student"
  width={400}
  height={400}
  quality={75} // Compress
  placeholder="blur" // Show blur while loading
/>
```

---

### 5. Font Optimization

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeFonts: true,
  },
}
```

---

## 🎯 PRIORITY COMPONENTS FOR LAZY LOADING

### High Priority (Large Components)

1. **Charts & Graphs**
   ```typescript
   const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'))
   const PipelineChart = dynamic(() => import('@/components/charts/PipelineChart'))
   ```

2. **Rich Text Editors**
   ```typescript
   const RichTextEditor = dynamic(() => import('@/components/features/ai/RichTextEditor'))
   ```

3. **Data Tables with Many Rows**
   ```typescript
   const StudentTable = dynamic(() => import('@/components/features/students/StudentTable'))
   ```

4. **File Uploaders**
   ```typescript
   const KnowledgeUpload = dynamic(() => import('@/components/knowledge/KnowledgeUpload'))
   ```

5. **Analytics Dashboards**
   ```typescript
   const AnalyticsDashboard = dynamic(() => import('@/components/dashboard/AnalyticsDashboard'))
   ```

### Medium Priority

6. **Modals & Dialogs**
   ```typescript
   const StudentDetailModal = dynamic(() => import('@/components/features/students/StudentDetailModal'))
   ```

7. **Kanban Boards**
   ```typescript
   const KanbanBoard = dynamic(() => import('@/components/features/students/KanbanBoard'))
   ```

### Low Priority (Already Small)

- UI primitives (Button, Input, Card)
- Layout components (Navbar, Sidebar)
- Simple forms

---

## 📈 MEASURING IMPACT

### Before Optimization

```bash
npm run build
# Check output for bundle sizes
```

Example output:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    2.5 kB   150 kB
├ ○ /students                            5.2 kB   180 kB
├ ○ /analytics                           8.5 kB   220 kB  ← Large!
└ ○ /knowledge                           3.1 kB   160 kB
```

### After Optimization

```bash
ANALYZE=true npm run build
# Review analyzer report
```

Expected improvements:
- ✅ Initial load: 150kB → 100kB (-33%)
- ✅ Students page: 180kB → 120kB (-33%)
- ✅ Analytics page: 220kB → 140kB (-36%)

---

## 🔍 BUNDLE ANALYSIS CHECKLIST

### Run Analysis
- [ ] Install @next/bundle-analyzer
- [ ] Configure next.config.ts
- [ ] Run `ANALYZE=true npm run build`
- [ ] Review client.html
- [ ] Review server.html
- [ ] Review edge.html

### Identify Issues
- [ ] Find chunks > 100KB
- [ ] Check for duplicate dependencies
- [ ] Identify unused imports
- [ ] Look for large third-party libs

### Implement Optimizations
- [ ] Add dynamic imports for heavy components
- [ ] Replace heavy libraries
- [ ] Enable tree shaking
- [ ] Optimize images
- [ ] Optimize fonts

### Verify Results
- [ ] Re-run bundle analysis
- [ ] Compare before/after sizes
- [ ] Test page load performance
- [ ] Verify no functionality broken

---

## 💡 BEST PRACTICES

### 1. Don't Over-Optimize

```typescript
// ❌ BAD - Too many dynamic imports hurt UX
const Button = dynamic(() => import('@/components/ui/button'))
const Input = dynamic(() => import('@/components/ui/input'))

// ✅ GOOD - Only lazy load heavy components
const Chart = dynamic(() => import('@/components/charts/Chart'))
```

### 2. Provide Good Loading States

```typescript
// ❌ BAD - No loading state
const HeavyComponent = dynamic(() => import('./HeavyComponent'))

// ✅ GOOD - Skeleton loader
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <Skeleton className="h-64 w-full" /> }
)
```

### 3. Consider User Journey

```typescript
// Prefetch likely-next-page components
useEffect(() => {
  if (userRole === 'admin') {
    import('@/components/admin/AdminDashboard') // Preload
  }
}, [userRole])
```

### 4. Monitor Real Performance

```typescript
// Report actual load times
const start = performance.now()
const module = await import('./HeavyComponent')
const end = performance.now()

console.log(`Module loaded in ${end - start}ms`)
```

---

## 🧪 TESTING

### Manual Testing

1. **Check Network Tab**
   - Open DevTools → Network
   - Navigate to pages
   - Verify chunks load on demand

2. **Measure Load Times**
   ```javascript
   // In browser console
   performance.getEntriesByType('resource')
     .filter(r => r.name.includes('.js'))
     .map(r => ({ name: r.name, size: r.transferSize, time: r.duration }))
   ```

3. **Lighthouse Audit**
   ```bash
   npm run build
   npm start
   # Run Lighthouse in Chrome DevTools
   ```

### Automated Testing

Add to CI/CD:
```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check
on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: ANALYZE=true npm run build
      - name: Check bundle size
        run: |
          # Fail if bundle > threshold
          if [ $(du -k .next/static/chunks | cut -f1) -gt 500 ]; then
            echo "Bundle too large!"
            exit 1
          fi
```

---

## 📚 RESOURCES

- **[next.config.ts](./next.config.ts)** - Bundle analyzer config
- **[Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)**
- **[Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)**
- **[Web Vitals](https://web.dev/vitals/)**

---

## ✅ IMPLEMENTATION CHECKLIST

### Setup
- [x] Install @next/bundle-analyzer
- [x] Configure next.config.ts
- [ ] Add analyze script to package.json

### Analysis
- [ ] Run initial bundle analysis
- [ ] Document current bundle sizes
- [ ] Identify top 5 largest chunks

### Optimization
- [ ] Add dynamic imports for heavy components
- [ ] Replace heavy libraries
- [ ] Enable tree shaking
- [ ] Optimize images & fonts
- [ ] Remove unused dependencies

### Verification
- [ ] Re-run bundle analysis
- [ ] Compare before/after
- [ ] Test all features work
- [ ] Measure performance improvement
- [ ] Update documentation

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Ready to use
