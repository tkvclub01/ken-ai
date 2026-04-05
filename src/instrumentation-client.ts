// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { initWebVitals, setupPerformanceObserver } from "@/lib/web-vitals";

Sentry.init({
  dsn: "https://1cd3c019d5a61275ba961939da109ea3@o4511161436405760.ingest.us.sentry.io/4511161437126656",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

// Initialize Core Web Vitals monitoring
if (typeof window !== 'undefined') {
  initWebVitals({
    sendToSentry: true,
    debug: process.env.NODE_ENV === 'development',
  })

  // Setup performance observer for custom metrics
  setupPerformanceObserver()
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
