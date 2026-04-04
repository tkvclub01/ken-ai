'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'counselor' | 'processor'
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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch user profile and permissions
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Fetch permissions
      const { data: permData, error: permError } = await supabase.rpc(
        'get_user_permissions',
        { user_id: userId }
      )

      if (permError) throw permError

      return {
        profile: profile as UserProfile,
        permissions: (permData as string[]) || []
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      return null
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (session?.user) {
          const userData = await fetchUserData(session.user.id)
          
          if (userData) {
            setUser({
              ...session.user,
              profile: userData.profile,
              permissions: userData.permissions
            })
          } else {
            setUser(session.user)
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user.id)
        setUser({
          ...session.user,
          profile: userData?.profile,
          permissions: userData?.permissions
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (session?.user) {
        // Token refreshed or user updated
        const userData = await fetchUserData(session.user.id)
        setUser({
          ...session.user,
          profile: userData?.profile,
          permissions: userData?.permissions
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserData, supabase])

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.permissions) return false
    return user.permissions.includes(permission)
  }, [user])

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false
    return permissions.some(perm => user.permissions!.includes(perm))
  }, [user])

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false
    return permissions.every(perm => user.permissions!.includes(perm))
  }, [user])

  // Check user role
  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!user?.profile?.role) return false
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(user.profile.role)
  }, [user])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    
    const userData = await fetchUserData(user.id)
    if (userData) {
      setUser(prev => prev ? {
        ...prev,
        profile: userData.profile,
        permissions: userData.permissions
      } : null)
    }
  }, [user?.id, fetchUserData])

  return {
    user,
    profile: user?.profile,
    permissions: user?.permissions,
    loading,
    error,
    isAuthenticated: !!user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    signOut,
    refreshUser
  }
}

// Legacy hook for backwards compatibility
export function useUser() {
  return useAuth()
}
