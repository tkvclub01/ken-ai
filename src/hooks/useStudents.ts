'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student, StudentInsert, StudentUpdate } from '@/types'
import { handleError, handleSupabaseError } from '@/lib/errors'
import { useMemo } from 'react'
import { toast } from 'sonner'

/**
 * Hook to fetch all students with optional filters
 */
export function useStudents(filters?: {
  status?: string
  stage?: string
  counselorId?: string
}) {
  const supabase = createClient()
  
  // Stabilize filters object reference to prevent unnecessary refetches
  const stableFilters = useMemo(() => filters || {}, [filters?.status, filters?.stage, filters?.counselorId])

  return useQuery({
    queryKey: ['students', stableFilters],
    queryFn: async () => {
      try {
        // First, fetch all students
        let query = supabase
          .from('students')
          .select('*')

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        if (filters?.counselorId) {
          query = query.eq('counselor_id', filters.counselorId)
        }

        const { data: studentsData, error: studentsError } = await query.order('created_at', { ascending: false })

        if (studentsError) {
          console.error('Error fetching students:', studentsError)
          throw new Error(studentsError.message)
        }

        if (!studentsData || studentsData.length === 0) {
          return [] as Student[]
        }

        // Fetch pipeline data separately
        const studentIds = studentsData.map(s => s.id)
        const { data: pipelineData, error: pipelineError } = await supabase
          .from('student_pipeline')
          .select('student_id, current_stage_id')
          .in('student_id', studentIds)

        if (pipelineError) {
          console.error('Error fetching pipeline:', pipelineError)
          // Continue without pipeline data
        }

        // Create a map of student_id to pipeline data
        const pipelineMap = new Map()
        pipelineData?.forEach((p: any) => {
          pipelineMap.set(p.student_id, p)
        })

        // Transform the data
        const transformedData = studentsData.map((student: any) => {
          const pipeline = pipelineMap.get(student.id)
          return {
            ...student,
            current_stage: pipeline?.current_stage_id || 'lead',
            pipeline_stage_name: 'Lead' // Default value
          }
        })

        // Filter by stage after transformation if needed
        if (filters?.stage) {
          return transformedData.filter((s: any) => s.current_stage === filters.stage)
        }

        return transformedData as Student[]
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useStudents query failed:', appError)
        throw appError
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()

        if (studentError) {
          console.error('Error fetching student:', studentError)
          throw new Error(studentError.message)
        }

        // Fetch pipeline data separately
        const { data: pipelineData, error: pipelineError } = await supabase
          .from('student_pipeline')
          .select('student_id, current_stage_id')
          .eq('student_id', id)
          .maybeSingle()

        if (pipelineError) {
          console.error('Error fetching pipeline:', pipelineError)
          // Continue without pipeline data
        }

        // Transform the data
        const transformedData = {
          ...studentData,
          current_stage: pipelineData?.current_stage_id || 'lead',
          pipeline_stage_name: 'Lead' // Default value
        } as Student

        return transformedData
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useStudent query failed:', appError)
        throw appError
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
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
      try {
        const { data, error } = await supabase
          .from('students')
          .insert(student)
          .select()
          .single()

        if (error) {
          const appError = handleSupabaseError(error)
          console.error('Error creating student:', appError)
          throw appError
        }

        return data as Student
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useCreateStudent mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (data) => {
      // Invalidate students list and add the new student to cache
      queryClient.invalidateQueries({ queryKey: ['students'] })
      // Optionally set the new student in cache for immediate access
      queryClient.setQueryData(['student', data.id], data)
    },
    onError: (error: any) => {
      console.error('Failed to create student:', error.message)
    },
  })
}

/**
 * Hook to update a student with OPTIMISTIC UPDATES
 * Provides instant UI feedback before server confirmation
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StudentUpdate }) => {
      try {
        // Separate current_stage from other data
        const { current_stage, ...restData } = data as any
        
        let result: any = null

        // Update student basic info
        if (Object.keys(restData).length > 0) {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .update(restData)
            .eq('id', id)
            .select()
            .single()

          if (studentError) {
            console.error('Error updating student:', studentError)
            throw new Error(studentError.message)
          }
          result = studentData
        }

        // Update pipeline stage if provided
        if (current_stage) {
          // Upsert the pipeline record
          const { error: pipelineError } = await supabase
            .from('student_pipeline')
            .upsert(
              {
                student_id: id,
                current_stage_id: current_stage
              },
              {
                onConflict: 'student_id'
              }
            )

          if (pipelineError) {
            console.error('Error updating pipeline:', pipelineError)
            throw new Error(pipelineError.message)
          }
        }

        // Fetch the updated student with pipeline data
        const { data: updatedStudent, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw new Error(fetchError.message)

        // Fetch pipeline data
        const { data: updatedPipeline, error: pipelineFetchError } = await supabase
          .from('student_pipeline')
          .select('current_stage_id')
          .eq('student_id', id)
          .maybeSingle()

        if (pipelineFetchError) {
          console.error('Error fetching updated pipeline:', pipelineFetchError)
        }

        return {
          ...updatedStudent,
          current_stage: updatedPipeline?.current_stage_id || current_stage || 'lead'
        } as Student
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUpdateStudent mutation failed:', appError)
        throw appError
      }
    },
    
    // OPTIMISTIC UPDATE: Execute before server confirms
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['students'] })
      await queryClient.cancelQueries({ queryKey: ['student', id] })

      // Snapshot the previous values for rollback
      const previousStudents = queryClient.getQueryData(['students'])
      const previousStudent = queryClient.getQueryData(['student', id])

      // Optimistically update the students list
      queryClient.setQueryData(['students'], (old: Student[] | undefined) => {
        if (!old) return old
        return old.map(student => 
          student.id === id ? { ...student, ...data } : student
        )
      })

      // Optimistically update the individual student
      queryClient.setQueryData(['student', id], (old: Student | undefined) => {
        if (!old) return old
        return { ...old, ...data }
      })

      // Return context with the snapshotted value
      return { previousStudents, previousStudent }
    },
    
    // If mutation fails, rollback to previous state
    onError: (err, variables, context) => {
      // Rollback students list
      if (context?.previousStudents) {
        queryClient.setQueryData(['students'], context.previousStudents)
      }
      
      // Rollback individual student
      if (context?.previousStudent) {
        queryClient.setQueryData(['student', variables.id], context.previousStudent)
      }
      
      // Show error toast
      toast.error('Cập nhật thất bại', {
        description: 'Dữ liệu đã được khôi phục về trạng thái trước đó',
        duration: 5000,
      })
      
      console.error('Failed to update student:', err)
    },
    
    // Always refetch after error or success to ensure consistency
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] })
      
      if (data) {
        // Update cache with server-confirmed data
        queryClient.setQueryData(['student', variables.id], data)
      }
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
      try {
        // Delete pipeline records first (cascade should handle this, but be explicit)
        await supabase
          .from('student_pipeline')
          .delete()
          .eq('student_id', id)

        const { error } = await supabase.from('students').delete().eq('id', id)
        if (error) {
          const appError = handleSupabaseError(error)
          console.error('Error deleting student:', appError)
          throw appError
        }
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useDeleteStudent mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, id) => {
      // Invalidate students list and remove deleted student from cache
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.removeQueries({ queryKey: ['student', id] })
    },
    onError: (error: any) => {
      console.error('Failed to delete student:', error.message)
    },
  })
}
