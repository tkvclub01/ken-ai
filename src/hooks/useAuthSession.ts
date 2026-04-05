'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UseAuthSessionOptions {
  onTokenExpired?: () => void
  onTokenRefreshed?: () => void
  onAuthStateChange?: (event: string, userId: string | null) => void
}

/**
 * Hook quản lý session và token expiration
 * - Tự động refresh token trước khi hết hạn (5 phút)
 * - Kiểm tra session định kỳ mỗi 2 phút
 * - Xử lý graceful logout khi token hết hạn
 */
export function useAuthSession(options?: UseAuthSessionOptions) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()
  const mountedRef = useRef(true)
  
  // Store options in ref to prevent subscription thrashing
  // Options object changes on every render, but we want stable reference
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  /**
   * Kiểm tra session hiện tại
   * @returns true nếu session hợp lệ, false nếu cần login lại
   */
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        console.warn('No valid session found')
        queryClient.clear()
        optionsRef.current?.onTokenExpired?.()
        return false
      }

      // Kiểm tra token sắp hết hạn (trong vòng 5 phút)
      const expiresAt = new Date(session.expires_at! * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log('⚠️ Token expiring soon, refreshing...')
        await refreshSession()
      } else if (timeUntilExpiry <= 0) {
        console.warn('❌ Token already expired')
        await handleSessionExpired()
        return false
      }

      return true
    } catch (error) {
      console.error('Session check failed:', error)
      return false
    }
  }, [queryClient, supabase.auth])

  /**
   * Refresh session token
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) throw error
      
      if (data.session) {
        console.log('✅ Session refreshed successfully')
        
        // Refetch critical user data với token mới
        await queryClient.refetchQueries({ 
          queryKey: ['user-profile'], 
          type: 'active',
          exact: false 
        })
        await queryClient.refetchQueries({ 
          queryKey: ['user-permissions'], 
          type: 'active',
          exact: false 
        })
        
        optionsRef.current?.onTokenRefreshed?.()
        return data.session
      }
    } catch (error: any) {
      console.error('Session refresh failed:', error)
      await handleSessionExpired()
      throw error
    }
  }, [queryClient, supabase.auth])

  /**
   * Xử lý khi session hết hạn
   * Redirect immediately - no delay needed as toast is already displayed
   */
  const handleSessionExpired = useCallback(async () => {
    console.log('🚪 Handling session expiration...')
    
    // Clear tất cả cache
    queryClient.clear()
    
    // Hiển thị thông báo
    toast.error('Phiên đăng nhập đã hết hạn', {
      description: 'Vui lòng đăng nhập lại để tiếp tục',
      duration: 5000,
    })
    
    // Redirect immediately - no setTimeout needed
    // Toast is non-blocking and will remain visible during navigation
    if (mountedRef.current) {
      optionsRef.current?.onTokenExpired?.()
      router.push('/login')
      router.refresh()
    }
  }, [queryClient, router])

  /**
   * Force logout - clear everything
   */
  const forceLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      queryClient.clear()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Force logout failed:', error)
    }
  }, [queryClient, router, supabase.auth])

  // Setup auth event listeners ONLY - No interval check needed
  // Supabase automatically handles token refresh
  useEffect(() => {
    mountedRef.current = true
    console.log('🔑 Setting up auth event listener')
    
    // Lắng nghe Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event)
        
        switch (event) {
          case 'INITIAL_SESSION':
            // Only log once, don't trigger any actions
            console.log('✅ Initial session loaded')
            optionsRef.current?.onAuthStateChange?.(event, session?.user?.id || null)
            break
            
          case 'TOKEN_REFRESHED':
            console.log('✅ Token auto-refreshed by Supabase')
            queryClient.invalidateQueries({ queryKey: ['user'] })
            optionsRef.current?.onTokenRefreshed?.()
            optionsRef.current?.onAuthStateChange?.(event, session?.user?.id || null)
            break
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out')
            queryClient.clear()
            optionsRef.current?.onAuthStateChange?.(event, null)
            break
            
          case 'USER_UPDATED':
            console.log('👤 User profile updated')
            if (session?.user) {
              queryClient.invalidateQueries({ 
                queryKey: ['user-profile', session.user.id] 
              })
            }
            optionsRef.current?.onAuthStateChange?.(event, session?.user?.id || null)
            break
            
          case 'SIGNED_IN':
            console.log('✅ User signed in')
            optionsRef.current?.onAuthStateChange?.(event, session?.user?.id || null)
            break
        }
      }
    )

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up auth event listener')
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [queryClient, supabase.auth])

  return {
    checkSession,
    refreshSession,
    forceLogout,
    handleSessionExpired,
  }
}
