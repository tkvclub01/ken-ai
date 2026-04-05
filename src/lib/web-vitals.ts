/**
 * Core Web Vitals Monitoring
 * 
 * Tracks LCP, FID, CLS and sends to analytics/Sentry
 */

import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'

// ============================================================================
// CONFIGURATION
// ============================================================================

interface WebVitalsConfig {
  sendToSentry?: boolean
  sendToAnalytics?: boolean
  debug?: boolean
}

const DEFAULT_CONFIG: WebVitalsConfig = {
  sendToSentry: true,
  sendToAnalytics: false, // Enable when you have analytics setup
  debug: process.env.NODE_ENV === 'development',
}

// ============================================================================
// METRIC REPORTING
// ============================================================================

/**
 * Report web vital metric to Sentry and/or analytics
 */
function reportMetric(metric: Metric, config: WebVitalsConfig) {
  const { name, value, id, rating } = metric

  // Log in development
  if (config.debug) {
    console.log(`[Web Vitals] ${name}:`, {
      value,
      rating,
      id,
      threshold: getThreshold(name),
    })
  }

  // Send to Sentry
  if (config.sendToSentry) {
    Sentry.withScope((scope) => {
      scope.setTag('metric_name', name)
      scope.setTag('metric_rating', rating)
      scope.setContext('web_vital', {
        name,
        value,
        rating,
        id,
        threshold: getThreshold(name),
        delta: value - getThreshold(name),
      })

      // Only send poor ratings as errors
      if (rating === 'poor') {
        Sentry.captureMessage(
          `Poor Web Vital: ${name} = ${value.toFixed(2)}`,
          'warning'
        )
      } else {
        // Track as breadcrumb for context
        Sentry.addBreadcrumb({
          category: 'web-vital',
          message: `${name}: ${value.toFixed(2)} (${rating})`,
          level: 'info',
          data: metric,
        })
      }
    })
  }

  // Send to analytics (when implemented)
  if (config.sendToAnalytics) {
    // Example: Send to Google Analytics
    // gtag('event', name, {
    //   value: Math.round(name === 'CLS' ? value * 1000 : value),
    //   event_category: 'Web Vitals',
    //   event_label: id,
    //   non_interaction: true,
    // })

    // Example: Send to custom analytics endpoint
    // sendToAnalyticsEndpoint({ metric, user_id, session_id })
  }
}

/**
 * Get threshold value for metric rating
 */
function getThreshold(metricName: string): number {
  const thresholds: Record<string, number> = {
    LCP: 2500,    // 2.5 seconds
    FID: 100,     // 100 milliseconds
    CLS: 0.1,     // 0.1
    FCP: 1800,    // 1.8 seconds
    TTFB: 800,    // 800 milliseconds
  }

  return thresholds[metricName] || 0
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Core Web Vitals monitoring
 * Call this once in your app initialization
 */
export function initWebVitals(config: WebVitalsConfig = DEFAULT_CONFIG) {
  // Largest Contentful Paint (LCP)
  // Measures loading performance
  // Good: < 2.5s
  onLCP((metric) => reportMetric(metric, config))

  // Interaction to Next Paint (INP) - replaces FID
  // Measures interactivity
  // Good: < 200ms
  onINP((metric) => reportMetric(metric, config))

  // Cumulative Layout Shift (CLS)
  // Measures visual stability
  // Good: < 0.1
  onCLS((metric) => reportMetric(metric, config))

  // First Contentful Paint (FCP)
  // Measures initial render
  // Good: < 1.8s
  onFCP((metric) => reportMetric(metric, config))

  // Time to First Byte (TTFB)
  // Measures server response time
  // Good: < 800ms
  onTTFB((metric) => reportMetric(metric, config))

  if (config.debug) {
    console.log('[Web Vitals] Monitoring initialized')
  }
}

// ============================================================================
// CUSTOM METRICS
// ============================================================================

/**
 * Track custom performance metrics
 */
export function trackCustomMetric(
  name: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms'
) {
  Sentry.withScope((scope) => {
    scope.setTag('custom_metric', name)
    scope.setContext('performance_metric', {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
    })

    Sentry.addBreadcrumb({
      category: 'custom-metric',
      message: `${name}: ${value}${unit}`,
      level: 'info',
    })
  })

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Custom Metric] ${name}: ${value}${unit}`)
  }
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === 'undefined') return

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  
  if (navigation) {
    const metrics = {
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'TCP Connection': navigation.connectEnd - navigation.connectStart,
      'Server Response': navigation.responseEnd - navigation.requestStart,
      'Content Download': navigation.responseEnd - navigation.responseStart,
      'DOM Processing': navigation.domComplete - navigation.domInteractive,
      'Page Load': navigation.loadEventEnd - navigation.startTime,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      trackCustomMetric(name, value, 'ms')
    })
  }
}

/**
 * Track resource loading performance
 */
export function trackResourcePerformance() {
  if (typeof window === 'undefined') return

  const resources = performance.getEntriesByType('resource')
  
  resources.forEach((resource: PerformanceResourceTiming) => {
    const duration = resource.duration
    
    // Track slow resources (> 1 second)
    if (duration > 1000) {
      trackCustomMetric(
        `Slow Resource: ${resource.name.split('/').pop()}`,
        duration,
        'ms'
      )
    }
  })
}

// ============================================================================
// PERFORMANCE OBSERVER
// ============================================================================

/**
 * Setup Performance Observer for custom metrics
 */
export function setupPerformanceObserver() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return
  }

  // Observe long tasks
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks > 50ms
          trackCustomMetric('Long Task', entry.duration, 'ms')
        }
      })
    })

    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    // Long task observer not supported
  }

  // Observe layout shifts
  try {
    const layoutShiftObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          trackCustomMetric('Layout Shift', entry.value, 'count')
        }
      })
    })

    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    // Layout shift observer not supported
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get performance rating based on value and metric type
 */
export function getPerformanceRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  }

  const threshold = thresholds[metricName]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metricName: string, value: number): string {
  switch (metricName) {
    case 'CLS':
      return value.toFixed(2)
    case 'LCP':
    case 'FID':
    case 'FCP':
    case 'TTFB':
      return `${value.toFixed(0)}ms`
    default:
      return value.toString()
  }
}
