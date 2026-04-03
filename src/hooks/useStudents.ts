'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student, StudentInsert, StudentUpdate } from '@/types'

/**
 * Hook to fetch all students with optional filters
 */
export function useStudents(filters?: {
  status?: string
  stage?: string
  counselorId?: string
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      let query = supabase.from('students').select('*')

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.stage) {
        query = query.eq('current_stage', filters.stage)
      }

      if (filters?.counselorId) {
        query = query.eq('counselor_id', filters.counselorId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Student[]
    },
  })
}

/**
 * Hook to fetch a single student by ID
 */
export function useStudent(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Student
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single()

      if (error) throw error
      return data as Student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StudentUpdate }) => {
      const { data: result, error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as Student
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
  })
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
  })
}
