import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Monitor network status and revalidate queries on reconnect
 * This ensures data stays fresh when user comes back online
 */
export function useNetworkStatus() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network reconnected, revalidating queries...')
      // Revalidate all active queries when coming back online
      queryClient.refetchQueries({ type: 'active' })
    }

    const handleOffline = () => {
      console.log('📴 Network disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])
}

/**
 * Subscribe to real-time student updates via Supabase Realtime
 * Automatically invalidates React Query cache when students change
 */
export function useStudentRealtimeUpdates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const setupSubscription = async () => {
      try {
        console.log('🔄 Setting up student realtime subscription...')

        // Check if user is authenticated before subscribing
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log('⚠️ No active session, skipping student realtime subscription')
          return
        }

        const channel = supabase
          .channel('students-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'students',
            },
            (payload) => {
              console.log('📊 Student change detected:', payload.eventType, payload.new)
              
              // Invalidate student-related queries
              queryClient.invalidateQueries({ queryKey: ['students'] })
              queryClient.invalidateQueries({ queryKey: ['student'] })
              queryClient.invalidateQueries({ queryKey: ['pipeline'] })
            }
          )
          .subscribe((status) => {
            if (!isMounted) return
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Student realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Student realtime subscription error - this is normal in development or without proper RLS policies')
            }
          })

        return () => {
          console.log('🛑 Cleaning up student realtime subscription')
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('❌ Error setting up student realtime subscription:', error)
      }
    }

    const cleanup = setupSubscription()

    return () => {
      isMounted = false
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [queryClient, supabase])
}

/**
 * Subscribe to real-time document updates via Supabase Realtime
 */
export function useDocumentRealtimeUpdates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const setupSubscription = async () => {
      try {
        console.log('🔄 Setting up document realtime subscription...')

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log('⚠️ No active session, skipping document realtime subscription')
          return
        }

        const channel = supabase
          .channel('documents-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'documents',
            },
            (payload) => {
              console.log('📄 Document change detected:', payload.eventType)
              
              // Invalidate document-related queries
              queryClient.invalidateQueries({ queryKey: ['documents'] })
              queryClient.invalidateQueries({ queryKey: ['document'] })
            }
          )
          .subscribe((status) => {
            if (!isMounted) return
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Document realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Document realtime subscription error - this is normal in development or without proper RLS policies')
            }
          })

        return () => {
          console.log('🛑 Cleaning up document realtime subscription')
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('❌ Error setting up document realtime subscription:', error)
      }
    }

    const cleanup = setupSubscription()

    return () => {
      isMounted = false
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [queryClient, supabase])
}

/**
 * Subscribe to real-time knowledge base article updates
 */
export function useKnowledgeBaseRealtimeUpdates() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const setupSubscription = async () => {
      try {
        console.log('🔄 Setting up knowledge base realtime subscription...')

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log('⚠️ No active session, skipping knowledge base realtime subscription')
          return
        }

        const channel = supabase
          .channel('knowledge-articles-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'knowledge_articles',
            },
            (payload) => {
              console.log('📚 Knowledge article change detected:', payload.eventType)
              
              // Invalidate knowledge base queries
              queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
              queryClient.invalidateQueries({ queryKey: ['article-usage'] })
              queryClient.invalidateQueries({ queryKey: ['content-gaps'] })
            }
          )
          .subscribe((status) => {
            if (!isMounted) return
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Knowledge base realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Knowledge base realtime subscription error - this is normal in development or without proper RLS policies')
            }
          })

        return () => {
          console.log('🛑 Cleaning up knowledge base realtime subscription')
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('❌ Error setting up knowledge base realtime subscription:', error)
      }
    }

    const cleanup = setupSubscription()

    return () => {
      isMounted = false
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [queryClient, supabase])
}

/**
 * Combined hook for all realtime subscriptions
 * Use this in the main layout or dashboard page
 */
export function useAllRealtimeSubscriptions() {
  useNetworkStatus()
  useStudentRealtimeUpdates()
  useDocumentRealtimeUpdates()
  useKnowledgeBaseRealtimeUpdates()
}
