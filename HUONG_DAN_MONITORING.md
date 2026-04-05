# 🛠️ HƯỚNG DẪN SỬ DỤNG MONITORING TOOLS

**Ngày:** 2026-04-04  
**Status:** Đã setup xong

---

## 📋 MỤC LỤC

1. [React Query DevTools](#react-query-devtools)
2. [Sentry Error Tracking](#sentry-error-tracking)
3. [Custom Logger](#custom-logger)
4. [Testing & Verification](#testing--verification)

---

## 🔍 REACT QUERY DEVTOOLS

### ✅ Đã Setup

DevTools đã được tích hợp vào `ReactQueryProvider.tsx` và chỉ hoạt động trong development mode.

### 🎯 Cách Sử Dụng

1. **Chạy dev server:**
   ```bash
   npm run dev
   ```

2. **Mở ứng dụng:** http://localhost:3000

3. **Tìm DevTools button:**
   - Góc dưới bên phải màn hình
   - Icon màu đỏ/cam với chữ "🔍"
   - Click để mở panel

4. **Features available:**
   - 👁️ Xem tất cả queries đang active
   - 🔄 Refetch queries manually
   - ❌ Invalidate cache
   - ⚡ Simulate errors (Error, Network Error)
   - 📊 Xem query state, data, error
   - ⏱️ Timing information

### 💡 Tips

```typescript
// Trong DevTools panel:
// 1. Click vào query để xem chi tiết
// 2. Right-click → "Refetch" để test refetch
// 3. Click "Simulate Error" để test error handling
// 4. Xem "Query Key" để debug caching issues
```

### 🚫 Production

DevTools tự động disabled trong production (`NODE_ENV === 'production'`).

---

## 🐛 SENTRY ERROR TRACKING

### ✅ Đã Install & Configure

Sentry đã được setup với wizard và tạo các files cấu hình cần thiết.

### 📁 Files Được Tạo

1. **`sentry.server.config.ts`** - Server-side config
2. **`sentry.edge.config.ts`** - Edge runtime config
3. **`src/instrumentation.ts`** - Next.js instrumentation
4. **`src/instrumentation-client.ts`** - Client-side init
5. **`src/app/global-error.tsx`** - Global error boundary
6. **`.env.sentry-build-plugin`** - Auth token (gitignored)

### 🔧 Configuration

**File:** `next.config.ts`

Sentry đã được thêm vào Next.js config:

```typescript
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry options
    org: "hpd-kk",
    project: "javascript-nextjs",
    
    // Source maps
    silent: !process.env.CI,
    widenClientFileUpload: true,
    
    // Performance
    telemetry: false,
  }
);
```

### 🌐 Environment Variables

**Development (.env.local):**
```bash
# Sentry DSN (from sentry.io project settings)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Auth token for source map upload
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiO...
```

**Production (CI/CD):**
```bash
# Add to your CI environment variables
SENTRY_AUTH_TOKEN=your_sentry_token_here  # Get from Sentry dashboard
```

### 📝 Cách Sử Dụng

#### 1. Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exception
try {
  const data = await fetchStudents()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'students',
      action: 'fetch',
    },
    extra: {
      filters: { status: 'active' },
      timestamp: new Date().toISOString(),
    },
  })
}
```

#### 2. Custom Messages

```typescript
Sentry.captureMessage('Student created successfully', {
  level: 'info',
  tags: {
    student_id: studentId,
  },
})
```

#### 3. Breadcrumbs (User Journey)

```typescript
Sentry.addBreadcrumb({
  category: 'ui.action',
  message: 'User clicked submit button',
  level: 'info',
  data: {
    form: 'student-form',
    action: 'create',
  },
})
```

#### 4. User Context

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
  role: user.role,
})
```

### 🧪 Testing Sentry

**Option 1: Example Page**

Sentry wizard đã tạo trang test:

```bash
npm run dev
# Visit: http://localhost:3000/sentry-example-page
# Click button to trigger test error
```

**Option 2: Example API Route**

```bash
# Test API error
curl http://localhost:3000/api/sentry-example-api
```

**Option 3: Manual Test**

Tạo component test:

```typescript
'use client'

import * as Sentry from '@sentry/nextjs'

export function SentryTestButton() {
  const handleClick = () => {
    try {
      throw new Error('Test error from Ken-AI')
    } catch (error) {
      Sentry.captureException(error)
      alert('Error captured! Check Sentry dashboard.')
    }
  }

  return (
    <button onClick={handleClick}>
      Test Sentry
    </button>
  )
}
```

### 📊 Sentry Dashboard

1. **Login:** https://sentry.io
2. **Project:** hpd-kk / javascript-nextjs
3. **Xem:**
   - Issues tab: All errors
   - Releases tab: Deployments
   - Performance tab: Slow queries
   - Sessions tab: Crash-free rate

### 🚀 Deployment

**Source Maps Upload:**

Sentry tự động upload source maps khi build:

```bash
npm run build
# Source maps automatically uploaded to Sentry
```

**Verify Upload:**

```bash
# Check build output for:
# "Successfully uploaded source maps to Sentry"
```

---

## 📝 CUSTOM LOGGER (useLogger)

### ✅ Đã Create

File: [`src/hooks/useLogger.ts`](./src/hooks/useLogger.ts)

### 🎯 Features

- ✅ Environment-aware (dev vs prod)
- ✅ Configurable log levels
- ✅ Prefix support
- ✅ Auto-suppression in production
- ✅ Utility methods (group, table)

### 📖 Cách Sử Dụng

#### Basic Usage

```typescript
import { useLogger } from '@/hooks/useLogger'

export function StudentList() {
  const logger = useLogger({ prefix: '[StudentList]' })
  
  useEffect(() => {
    logger.info('Component mounted')
    logger.debug('Initial render')
  }, [])
  
  const handleFetch = async () => {
    logger.info('Fetching students...')
    try {
      const data = await fetchStudents()
      logger.info(`Fetched ${data.length} students`)
    } catch (error) {
      logger.error('Failed to fetch students', error)
    }
  }
  
  return <div>...</div>
}
```

#### Different Log Levels

```typescript
const logger = useLogger({ 
  prefix: '[Analytics]',
  minLevel: 'debug' // 'debug' | 'info' | 'warn' | 'error'
})

logger.debug('Detailed debug info', { data, props })
logger.info('General information')
logger.warn('Warning message')
logger.error('Error occurred', error)
```

#### Grouping Logs

```typescript
const logger = useLogger({ prefix: '[Dashboard]' })

logger.group('Loading Analytics Data')
logger.info('Fetching revenue...')
logger.info('Fetching students...')
logger.info('Fetching pipeline...')
logger.groupEnd()

// Console output:
// [Dashboard] Loading Analytics Data
//   [Dashboard] Fetching revenue...
//   [Dashboard] Fetching students...
//   [Dashboard] Fetching pipeline...
```

#### Table Display

```typescript
const logger = useLogger({ prefix: '[Performance]' })

// Display data as table
logger.table([
  { metric: 'LCP', value: '1.2s', status: 'good' },
  { metric: 'FID', value: '50ms', status: 'good' },
  { metric: 'CLS', value: '0.05', status: 'good' },
])
```

#### Disable Logging

```typescript
// Temporarily disable
const logger = useLogger({ enabled: false })

// Or set high minLevel
const logger = useLogger({ minLevel: 'error' }) // Only errors
```

### 🌍 Global Logger (Outside Components)

```typescript
import { globalLogger } from '@/hooks/useLogger'

// In utility functions, services, etc.
export async function fetchData() {
  globalLogger.info('Starting fetch')
  try {
    const response = await fetch('/api/data')
    globalLogger.debug('Response received', response.status)
    return response.json()
  } catch (error) {
    globalLogger.error('Fetch failed', error)
    throw error
  }
}
```

### 🎨 Log Output Examples

**Development Mode:**
```
2026-04-04T10:30:00.000Z [Students] Component mounted
2026-04-04T10:30:00.100Z [Students] Fetching students...
2026-04-04T10:30:00.500Z [Students] Fetched 25 students
```

**Production Mode:**
```
(Only warnings and errors are logged)
2026-04-04T10:30:00.500Z [Students] Failed to fetch students
```

### 💡 Best Practices

1. **Use Prefixes:**
   ```typescript
   const logger = useLogger({ prefix: '[ComponentName]' })
   ```

2. **Appropriate Levels:**
   - `debug`: Detailed technical info
   - `info`: General flow information
   - `warn`: Unexpected but handled situations
   - `error`: Actual errors

3. **Don't Log Sensitive Data:**
   ```typescript
   // ❌ BAD
   logger.info('User login', { password: user.password })
   
   // ✅ GOOD
   logger.info('User login', { userId: user.id })
   ```

4. **Group Related Logs:**
   ```typescript
   logger.group('Form Submission')
   logger.info('Validating...')
   logger.info('Submitting...')
   logger.groupEnd()
   ```

---

## 🧪 TESTING & VERIFICATION

### Checklist

#### React Query DevTools
- [ ] Dev server running
- [ ] DevTools button visible (bottom-right)
- [ ] Can open/close panel
- [ ] Queries listed in panel
- [ ] Can simulate errors
- [ ] Can refetch queries
- [ ] Hidden in production build

#### Sentry
- [ ] `.env.sentry-build-plugin` exists
- [ ] `SENTRY_AUTH_TOKEN` configured
- [ ] Example page works (`/sentry-example-page`)
- [ ] Errors appear in Sentry dashboard
- [ ] Source maps uploaded on build
- [ ] User context set correctly

#### useLogger
- [ ] Logs appear in console (dev mode)
- [ ] Prefixes showing correctly
- [ ] Different levels work (debug, info, warn, error)
- [ ] Production mode suppresses debug/info
- [ ] Group/table utilities work
- [ ] Global logger works outside components

### Quick Test Script

Tạo file test: `src/app/test-monitoring/page.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useLogger } from '@/hooks/useLogger'
import * as Sentry from '@sentry/nextjs'

export default function TestMonitoringPage() {
  const logger = useLogger({ prefix: '[TestPage]' })
  
  useEffect(() => {
    // Test logger
    logger.info('Test monitoring page loaded')
    logger.debug('Debug message (only in dev)')
    logger.warn('Warning message')
    
    // Test Sentry
    Sentry.captureMessage('Test message from monitoring page', {
      level: 'info',
      tags: { test: 'monitoring' },
    })
  }, [logger])
  
  const testError = () => {
    try {
      throw new Error('Test error from monitoring page')
    } catch (error) {
      logger.error('Caught test error', error)
      Sentry.captureException(error)
    }
  }
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Monitoring Test Page</h1>
      
      <div className="space-y-2">
        <h2 className="font-semibold">Tests:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Check console for logger messages</li>
          <li>Open React Query DevTools (bottom-right)</li>
          <li>Check Sentry dashboard for test events</li>
        </ul>
      </div>
      
      <button
        onClick={testError}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Trigger Test Error
      </button>
      
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser console (F12)</li>
          <li>Look for [TestPage] logs</li>
          <li>Click React Query DevTools icon</li>
          <li>Visit Sentry dashboard</li>
          <li>Verify test error appears</li>
        </ol>
      </div>
    </div>
  )
}
```

**Test:**
```bash
npm run dev
# Visit: http://localhost:3000/test-monitoring
# Follow instructions on page
```

---

## 📊 MONITORING DASHBOARD

### Local Development

1. **Console Logs:** Browser DevTools → Console tab
2. **React Queries:** DevTools panel (bottom-right)
3. **Network Requests:** DevTools → Network tab
4. **Performance:** DevTools → Performance tab

### Production (Sentry)

1. **Issues:** https://sentry.io/organizations/hpd-kk/issues/
2. **Releases:** https://sentry.io/organizations/hpd-kk/releases/
3. **Performance:** https://sentry.io/organizations/hpd-kk/performance/
4. **Sessions:** https://sentry.io/organizations/hpd-kk/sessions/

### Key Metrics to Monitor

- **Error Rate:** Should be < 1%
- **Crash-Free Sessions:** Should be > 99%
- **Average Response Time:** < 500ms
- **Cache Hit Rate:** > 80%
- **Failed Queries:** Track trends

---

## 🚀 NEXT STEPS

1. ✅ React Query DevTools - Done
2. ✅ Sentry Integration - Done
3. ✅ Custom Logger - Done
4. ⏳ Core Web Vitals Monitoring - Next
5. ⏳ Query Performance Dashboard - Future

---

## 📚 RESOURCES

- [React Query DevTools Docs](https://tanstack.com/query/latest/docs/devtools)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Capture Methods](https://docs.sentry.io/platforms/javascript/usage/)
- [useLogger Implementation](./src/hooks/useLogger.ts)

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Ready to use
