# 🧪 HƯỚNG DẪN TESTING & PERFORMANCE MONITORING

**Ngày:** 2026-04-04  
**Status:** Production-ready với đầy đủ testing infrastructure

---

## 📋 MỤC LỤC

1. [Unit Tests](#unit-tests)
2. [Bundle Analysis](#bundle-analysis)
3. [Query Performance Dashboard](#query-performance-dashboard)
4. [Web Vitals Monitoring](#web-vitals-monitoring)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Future Enhancements](#future-enhancements)

---

## 🧪 UNIT TESTS

### Run All Tests

```bash
npm test
```

**Current Status:** ✅ **16/16 tests passing**

**Test Coverage:**
- ✅ Type Guards (isStudent, isValidStudentStatus)
- ✅ Helper Functions (safeJsonParse, filterNonNull, createRecord)
- ✅ Edge Cases (null, undefined, invalid inputs)

### Test Watch Mode

```bash
npm run test:watch
```

Watches for file changes and re-runs affected tests automatically.

### Test Coverage Report

```bash
npm run test:coverage
```

Generates detailed coverage report in `coverage/` directory.

### Test File Structure

```
src/
├── types/
│   ├── utils.ts          # Type utilities
│   └── utils.test.ts     # Tests for type utilities
jest.config.ts            # Jest configuration
jest.setup.ts             # Test setup with mocks
```

### Writing New Tests

**Example Test Pattern:**

```typescript
import { isStudent } from '@/types/utils'

describe('isStudent', () => {
  it('should return true for valid student object', () => {
    const student = {
      id: '123',
      full_name: 'John Doe',
      email: 'john@example.com',
      // ... other required fields
    }
    
    expect(isStudent(student)).toBe(true)
  })

  it('should return false for invalid object', () => {
    expect(isStudent({ name: 'John' })).toBe(false)
  })

  it('should return false for null', () => {
    expect(isStudent(null)).toBe(false)
  })
})
```

### Mock Strategy

**Already Configured Mocks:**
- ✅ Next.js Router (useRouter, usePathname, etc.)
- ✅ Supabase Client (createClient, queries)
- ✅ React Query (useQuery, useMutation)
- ✅ Toast Notifications (sonner)
- ✅ ResizeObserver API

**Usage Example:**

```typescript
// Tests automatically use mocks from jest.setup.ts
// No need to manually mock in each test file

test('component renders correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

---

## 📦 BUNDLE ANALYSIS

### Run Bundle Analyzer

```bash
ANALYZE=true npm run build -- --webpack
```

**Output:** Opens browser with interactive bundle visualization

**What to Look For:**
- 🔴 **Large chunks** (>500KB) - Consider code splitting
- 🟡 **Duplicate dependencies** - Check package.json
- 🟢 **Tree-shaking opportunities** - Unused exports

### Current Bundle Status

**Build Tool:** Next.js 16.2.2 with Turbopack  
**Analyzer:** @next/bundle-analyzer (Webpack mode)

**Note:** Bundle analyzer requires Webpack mode (`--webpack` flag) as it's not compatible with Turbopack yet.

### Optimization Strategies

#### 1. Dynamic Imports

```typescript
// Before
import { HeavyChart } from '@/components/charts/HeavyChart'

// After
const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false, // If chart doesn't need SSR
})
```

#### 2. Route-based Code Splitting

Next.js automatically splits by routes. Ensure:
- ✅ Each route is a separate folder
- ✅ Large components use dynamic imports
- ✅ Shared components are properly memoized

#### 3. Third-party Library Optimization

```typescript
// Import only what you need
import { debounce } from 'lodash-es'  // ✅ Tree-shakeable
// NOT: import _ from 'lodash'         // ❌ Imports everything
```

### Bundle Size Budget (Recommended)

| Resource | Budget | Current | Status |
|----------|--------|---------|--------|
| **JavaScript** | <500KB | TBD | 🟡 Monitor |
| **CSS** | <100KB | TBD | 🟡 Monitor |
| **Images** | <1MB/page | TBD | 🟡 Monitor |
| **Total Initial Load** | <2MB | TBD | 🟡 Monitor |

---

## 📊 QUERY PERFORMANCE DASHBOARD

### Access Dashboard

```bash
npm run dev
# Visit: http://localhost:3000/admin/query-dashboard
```

### Features

#### Real-Time Statistics
- 📊 Total Queries in cache
- ⚡ Active Queries (with observers)
- ⏰ Stale Queries (need refresh)
- ❌ Error Queries (failed fetches)

#### Cache Hit Rate
- Shows percentage of cache hits vs network calls
- Target: >80% for optimal performance
- Progress bar visualization

#### Query List Details
Each query shows:
- Full query key path
- Status badge (color-coded)
- Observer count
- Last update time
- Data size estimate
- Fetch status

### Using the Dashboard

#### Manual Refresh
Click "Refresh" button to update statistics immediately.

#### Auto-Refresh
Toggle "Auto-refresh" to update every 2 seconds automatically.

#### Identifying Issues

**High Stale Count:**
- ⚠️ Indicates queries not being refreshed
- 💡 Solution: Decrease staleTime or add background refetching

**Many Errors:**
- ❌ Check error messages in console
- 💡 Solution: Fix API endpoints or error handling

**Low Cache Hit Rate (<70%):**
- 🟡 Too many network calls
- 💡 Solution: Increase staleTime, add prefetching

### Example Scenarios

#### Scenario 1: Healthy Cache
```
Cache Hit Rate: 92%
Total Queries: 18
Active: 7
Stale: 2
Errors: 0
```
✅ **Excellent!** Most data served from cache.

#### Scenario 2: Needs Optimization
```
Cache Hit Rate: 65%
Total Queries: 25
Active: 10
Stale: 12
Errors: 0
```
⚠️ **Warning:** Too many stale queries. Increase staleTime.

#### Scenario 3: Critical Issues
```
Cache Hit Rate: 45%
Total Queries: 30
Active: 8
Stale: 5
Errors: 7
```
❌ **Critical:** High error rate. Investigate immediately.

---

## 🚀 WEB VITALS MONITORING

### Automatic Monitoring

Web Vitals are automatically tracked in production via `instrumentation-client.ts`.

**Metrics Tracked:**
- 🎯 **LCP** (Largest Contentful Paint) - Target: <2.5s
- ⚡ **INP** (Interaction to Next Paint) - Target: <200ms
- 📐 **CLS** (Cumulative Layout Shift) - Target: <0.1
- 🎨 **FCP** (First Contentful Paint) - Target: <1.8s
- ⏱️ **TTFB** (Time to First Byte) - Target: <800ms

### Integration with Sentry

Poor ratings automatically sent to Sentry:
- Rating = "poor" → Captured as warning
- Rating = "good" → Sent as breadcrumb (for context)

### Custom Metrics

Track custom performance metrics:

```typescript
import { trackCustomMetric } from '@/lib/web-vitals'

// Track page load time
trackCustomMetric('Page Load Time', performance.now(), 'ms')

// Track API call duration
const start = performance.now()
await fetchData()
trackCustomMetric('API Fetch Time', performance.now() - start, 'ms')
```

### Monitoring in Production

#### Option 1: Sentry Dashboard
1. Login to Sentry: https://sentry.io
2. Navigate to your project: `hpd-kk/javascript-nextjs`
3. View "Performance" tab for Web Vitals
4. Filter by metric name (LCP, INP, CLS, etc.)

#### Option 2: Browser Console (Development)
```bash
npm run dev
# Open browser console to see debug logs
```

Set `debug: true` in `initWebVitals()` to enable console logging.

### Performance Budget Alerts

Set up alerts for:
- ❌ LCP > 4s
- ❌ INP > 500ms
- ❌ CLS > 0.25
- ❌ FCP > 3s

---

## ✅ MANUAL TESTING CHECKLIST

### Chat Page Testing

#### Test Case 1: Send Message
- [ ] Type message in input
- [ ] Click Send button
- [ ] Verify message appears instantly (optimistic update)
- [ ] Verify AI response streams word-by-word
- [ ] Verify auto-scroll to latest message

#### Test Case 2: Streaming Display
- [ ] Verify streaming indicator shows while typing
- [ ] Verify cursor blinks at end of streaming text
- [ ] Verify message timestamp displays correctly
- [ ] Verify user/AI avatars show correctly

#### Test Case 3: Error Handling
- [ ] Try sending empty message → Should show error toast
- [ ] Disconnect internet and send → Should rollback optimistic update
- [ ] Verify error message displays appropriately

#### Test Case 4: Caching
- [ ] Send multiple messages
- [ ] Navigate away from chat page
- [ ] Return to chat page
- [ ] Verify messages still visible (from cache)
- [ ] Wait 5+ minutes, verify refetch happens

### Query Dashboard Testing

#### Test Case 1: Basic Functionality
- [ ] Navigate to `/admin/query-dashboard`
- [ ] Verify statistics cards display correct counts
- [ ] Verify query list populates
- [ ] Verify cache hit rate shows percentage

#### Test Case 2: Auto-Refresh
- [ ] Enable auto-refresh toggle
- [ ] Wait 2 seconds
- [ ] Verify "Last updated" timestamp changes
- [ ] Disable auto-refresh

#### Test Case 3: Query Inspection
- [ ] Click on individual queries
- [ ] Verify query key displays correctly
- [ ] Verify status badges show correct colors
- [ ] Verify observer count is accurate
- [ ] Verify data size estimate displays

### Bundle Analysis Testing

#### Test Case 1: Run Analyzer
```bash
ANALYZE=true npm run build -- --webpack
```
- [ ] Build completes successfully
- [ ] Browser opens with bundle visualization
- [ ] Can navigate between chunks
- [ ] Can inspect individual modules

#### Test Case 2: Identify Optimization Opportunities
- [ ] Check for chunks >500KB
- [ ] Look for duplicate dependencies
- [ ] Identify large third-party libraries
- [ ] Note tree-shaking opportunities

### Web Vitals Testing

#### Test Case 1: Development Mode
```bash
npm run dev
```
- [ ] Open browser console
- [ ] Navigate through pages
- [ ] Verify metrics logged to console (if debug enabled)
- [ ] Check for any "poor" rating warnings

#### Test Case 2: Production Build
```bash
npm run build
npm start
```
- [ ] Browse application
- [ ] Check Sentry dashboard for metrics
- [ ] Verify no critical performance issues
- [ ] Confirm all metrics within target ranges

---

## 🔮 FUTURE ENHANCEMENTS

### 1. Real AI Integration

**Current Status:** Simulated responses  
**Goal:** Connect to Gemini/OpenAI API

**Implementation Steps:**
```typescript
// Replace simulateAIResponse with actual API call
const sendMessageMutation = useMutation({
  mutationFn: async (message: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
    return response.json()
  },
  // ... rest of mutation config
})
```

**Edge Function Setup:**
```typescript
// supabase/functions/chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { message } = await req.json()
  
  // Call Gemini API
  const response = await fetch('https://generativelanguage.googleapis.com/...', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}` },
    body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
  })
  
  const data = await response.json()
  return new Response(JSON.stringify(data))
})
```

### 2. E2E Testing with Playwright

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Example Test:**
```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test'

test('chat page sends and receives messages', async ({ page }) => {
  await page.goto('/chat')
  
  // Type message
  await page.fill('input[placeholder="Type your message..."]', 'Hello AI')
  
  // Click send
  await page.click('button[type="submit"]')
  
  // Verify message appears
  await expect(page.locator('text=Hello AI')).toBeVisible()
  
  // Verify AI response streams
  await expect(page.locator('[data-streaming="true"]')).toBeVisible()
})
```

**Run Tests:**
```bash
npx playwright test
npx playwright test --ui  # Interactive UI mode
```

### 3. CI/CD Pipeline

**GitHub Actions Example:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 4. Performance Budget Enforcement

**Install:**
```bash
npm install -D @next/bundle-analyzer webpack-bundle-analyzer
```

**Configure in next.config.ts:**
```typescript
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(
  withSentryConfig(nextConfig, {
    // ... existing config
  })
)

// Add performance budget check
const BUDGETS = {
  javascript: 500 * 1024, // 500KB
  css: 100 * 1024,        // 100KB
  total: 2 * 1024 * 1024, // 2MB
}
```

**CI Check:**
```bash
# Add to CI pipeline
ANALYZE=true npm run build -- --webpack
# Parse output and fail if budgets exceeded
```

### 5. Accessibility Audit with axe-core

**Installation:**
```bash
npm install -D @axe-core/react axe-core
```

**Integration:**
```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
import { configureAxe } from 'jest-axe'

const axe = configureAxe({
  rules: {
    // Customize rules
    'color-contrast': { enabled: true },
    'heading-order': { enabled: true },
  },
})

expect.extend(axe.toHaveNoViolations)
```

**Test Example:**
```typescript
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

test('chat page has no accessibility violations', async () => {
  const { container } = render(<ChatPage />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

**Automated Scanning:**
```bash
# Use Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## 📊 CURRENT STATUS SUMMARY

### Tests
- ✅ **Unit Tests:** 16/16 passing
- ⏳ **Integration Tests:** Framework ready, tests pending
- ⏳ **E2E Tests:** Not implemented yet

### Performance
- ✅ **Bundle Analyzer:** Configured (requires `--webpack` flag)
- ✅ **Query Dashboard:** Fully functional at `/admin/query-dashboard`
- ✅ **Web Vitals:** Auto-tracking in production
- ⏳ **Performance Budgets:** Not enforced yet

### Monitoring
- ✅ **Sentry:** Integrated for errors & performance
- ✅ **React Query DevTools:** Enabled in development
- ✅ **Custom Logging:** useLogger hook available
- ✅ **Core Web Vitals:** Automatic tracking

### Documentation
- ✅ **Testing Guide:** This document
- ✅ **Query Dashboard Guide:** HUONG_DAN_QUERY_DASHBOARD.md
- ✅ **Monitoring Guide:** HUONG_DAN_MONITORING.md
- ✅ **Type Safety Guide:** HUONG_DAN_TYPE_SAFETY_ERRORS.md

---

## 🎯 RECOMMENDED ACTIONS

### Immediate (This Week)
1. ✅ Run unit tests - **DONE** (16/16 passing)
2. ⏳ Review bundle analysis - In progress
3. ⏳ Check query dashboard - Pending
4. ⏳ Verify Web Vitals in production - Pending

### Short-term (This Month)
1. Add integration tests for critical flows
2. Set up CI/CD pipeline
3. Implement real AI integration for chat
4. Enforce performance budgets in CI

### Long-term (Next Quarter)
1. Add E2E tests with Playwright
2. Run accessibility audit
3. Optimize bundle size based on analysis
4. Set up automated performance monitoring alerts

---

## 📚 RESOURCES

### Official Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Next.js Bundle Analysis](https://nextjs.org/docs/app/guides/package-bundling)
- [Web Vitals](https://web.dev/vitals/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

### Project Files
- [`jest.config.ts`](./jest.config.ts) - Jest configuration
- [`jest.setup.ts`](./jest.setup.ts) - Test setup & mocks
- [`src/types/utils.test.ts`](./src/types/utils.test.ts) - Sample tests
- [`src/lib/web-vitals.ts`](./src/lib/web-vitals.ts) - Web Vitals tracking
- [`src/components/shared/QueryPerformanceDashboard.tsx`](./src/components/shared/QueryPerformanceDashboard.tsx) - Query dashboard

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Testing infrastructure complete, ready for expansion
