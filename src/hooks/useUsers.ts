import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'manager' | 'counselor' | 'processor' | 'student'
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null
  created_at: string
}

/**
 * Fetch all users with optional filters
 */
export function useUsers(filters?: {
  role?: string
  isActive?: boolean
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (filters?.role && filters.role !== 'all') {
          query = query.eq('role', filters.role)
        }

        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive)
        }

        const { data, error } = await query

        if (error) throw error
        return data as UserProfile[]
      } catch (error: any) {
        console.error('Error fetching users:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  })
}

/**
 * Update user profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'is_active'>>
    }) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data as UserProfile
      } catch (error: any) {
        console.error('Error updating user:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Update specific user in cache
      queryClient.setQueryData(['user', data.id], data)
    },
  })
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id)

        if (error) throw error
        return id
      } catch (error: any) {
        console.error('Error deleting user:', error)
        throw error
      }
    },
    onSuccess: (_, id) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Remove deleted user from cache
      queryClient.removeQueries({ queryKey: ['user', id] })
    },
  })
}
