'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from './useUserProfile'
import { useNetworkStatus } from './useRealtimeSubscriptions'
import { useAuthSession } from './useAuthSession'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'

// Singleton Supabase client - created once, reused everywhere
const supabase = createClient()

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'counselor' | 'processor' | 'student'
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null
}

interface PermissionData {
  role: string
  permissions: string[]
}

export interface AuthUser extends User {
  profile?: UserProfile
  permissions?: string[]
}

export function useAuth() {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Use React Query to cache session - fetches only ONCE until logout
  const { data: authUser, isLoading: sessionLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session?.user || null
    },
    staleTime: Infinity, // Never refetch automatically
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes after unmount
    retry: 1,
  })

  // Get user ID from auth state - memoize to prevent unnecessary re-renders
  const userId = useMemo(() => authUser?.id, [authUser?.id])

  // Use React Query for profile and permissions (with caching)
  const { 
    profile, 
    permissions, 
    isLoading: userDataLoading,
    refetch: refetchUserData,
    isError: userDataError
  } = useUserData(userId)

  // REALTIME SUBSCRIPTION DISABLED - Using React Query caching instead
  // Profile data is cached for 10 minutes (staleTime) and fetched from DB
  // When admin updates user role, manually invalidate:
  // queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
  
  // Monitor network status and revalidate on reconnect
  useNetworkStatus()

  // Manage session and token lifecycle
  const { checkSession, refreshSession, forceLogout } = useAuthSession({
    onTokenExpired: () => {
      // Clear session cache to force re-fetch on next render
      queryClient.setQueryData(['auth-session'], null)
      setError('Phiên đăng nhập đã hết hạn')
    },
    onTokenRefreshed: () => {
      console.log('✅ Token refreshed, user data will be refetched')
      // Refetch session with new token
      queryClient.invalidateQueries({ queryKey: ['auth-session'] })
    },
    onAuthStateChange: (event, userId) => {
      // Update session cache based on auth events
      if (event === 'SIGNED_OUT' || !userId) {
        queryClient.setQueryData(['auth-session'], null)
      } else {
        // Invalidate to refetch with latest data
        queryClient.invalidateQueries({ queryKey: ['auth-session'] })
      }
    }
  })

  // Construct the complete user object
  const user: AuthUser | null = authUser ? {
    ...authUser,
    profile,
    permissions
  } : null

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!permissions) return false
    return permissions.includes(permission)
  }, [permissions])

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissionsList: string[]): boolean => {
    if (!permissions) return false
    return permissionsList.some(perm => permissions.includes(perm))
  }, [permissions])

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissionsList: string[]): boolean => {
    if (!permissions) return false
    return permissionsList.every(perm => permissions.includes(perm))
  }, [permissions])

  // Check user role
  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!profile?.role) return false
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(profile.role)
  }, [profile])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Clear all caches
      queryClient.clear()
      // Redirect to login page after sign out
      window.location.href = '/login'
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase, queryClient])

  // Refresh user data (manually trigger cache invalidation)
  const refreshUser = useCallback(() => {
    if (userId) {
      refetchUserData()
    }
  }, [userId, refetchUserData])

  return {
    user,
    profile: user?.profile,
    permissions: user?.permissions,
    loading: sessionLoading || userDataLoading,
    error,
    isAuthenticated: !!user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    signOut,
    refreshUser,
    // Session management methods
    checkSession,
    refreshSession,
    forceLogout,
  }
}

// Legacy hook for backwards compatibility
export function useUser() {
  return useAuth()
}
