import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'counselor' | 'processor' | 'student'
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null
  created_at: string
}

/**
 * Fetch user profile with aggressive caching
 * Profile data rarely changes, so we cache it for a long time
 */
export function useUserProfile(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data as UserProfile
      } catch (error: any) {
        console.error('Error fetching user profile:', error)
        throw error
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - profile rarely changes
    gcTime: 1000 * 60 * 30,    // 30 minutes - keep in memory longer
    retry: 2,
  })
}

/**
 * Fetch user permissions with moderate caching
 * Permissions may change when admin updates roles
 */
export function useUserPermissions(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')

      try {
        const { data, error } = await supabase.rpc(
          'get_user_permissions',
          { user_id: userId }
        )

        if (error) throw error
        return (data as string[]) || []
      } catch (error: any) {
        console.error('Error fetching user permissions:', error)
        throw error
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,  // 5 minutes - permissions may change
    gcTime: 1000 * 60 * 15,    // 15 minutes
    retry: 2,
  })
}

/**
 * Combined hook for user data (profile + permissions)
 * Uses React Query's built-in deduplication to prevent redundant requests
 */
export function useUserData(userId: string | undefined) {
  const profileQuery = useUserProfile(userId)
  const permissionsQuery = useUserPermissions(userId)

  return {
    profile: profileQuery.data,
    permissions: permissionsQuery.data,
    isLoading: profileQuery.isLoading || permissionsQuery.isLoading,
    isError: profileQuery.isError || permissionsQuery.isError,
    isSuccess: profileQuery.isSuccess && permissionsQuery.isSuccess,
    error: profileQuery.error || permissionsQuery.error,
    refetch: () => {
      profileQuery.refetch()
      permissionsQuery.refetch()
    },
  }
}
