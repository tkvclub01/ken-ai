'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { toast } from 'sonner'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 min
            gcTime: 10 * 60 * 1000,   // 10 minutes - cached data persists for 10 min after unmount
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false, // Disable to prevent unnecessary refetches on tab switch
            refetchOnReconnect: true,    // Refetch when network reconnects
            refetchOnMount: false,       // Don't refetch on component mount if data is fresh
            
            // Network mode: always fetch when online, use cache when offline
            networkMode: 'online',
          },
          mutations: {
            retry: 1,                    // Retry mutations once on failure
            gcTime: 5 * 60 * 1000,      // Keep mutation state for 5 minutes
            networkMode: 'always',       // Mutations should always try to execute
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
          errorTypes={[
            {
              name: 'Error',
              initializer: (query) => new Error(`Error fetching ${query.queryKey}`),
            },
            {
              name: 'Network Error',
              initializer: () => new TypeError('Failed to fetch'),
            },
          ]}
        />
      )}
    </QueryClientProvider>
  )
}
