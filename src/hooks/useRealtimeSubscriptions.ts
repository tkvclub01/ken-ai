import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

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
