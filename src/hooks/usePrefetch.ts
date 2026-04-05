'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook cung cấp các hàm prefetch thông minh
 * Giúp tải dữ liệu trước khi user cần → trải nghiệm tức thì
 * 
 * @example
 * ```tsx
 * const { prefetchStudent, prefetchNextPage } = usePrefetch()
 * 
 * // Prefetch khi hover vào student row
 * <TableRow onMouseEnter={() => prefetchStudent(student.id)}>
 * 
 * // Prefetch trang tiếp theo khi hover pagination
 * <Button onMouseEnter={() => prefetchNextPage(currentPage)}>
 * ```
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  /**
   * Prefetch chi tiết student khi hover vào danh sách
   * Dữ liệu sẽ có sẵn trong cache → click là hiển thị ngay
   */
  const prefetchStudent = useCallback((studentId: string) => {
    // Chỉ prefetch nếu chưa có trong cache
    const existingData = queryClient.getQueryData(['student', studentId])
    if (existingData) return

    queryClient.prefetchQuery({
      queryKey: ['student', studentId],
      queryFn: async () => {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single()

        if (studentError) throw studentError

        // Fetch pipeline data
        const { data: pipelineData } = await supabase
          .from('student_pipeline')
          .select('student_id, current_stage_id')
          .eq('student_id', studentId)
          .maybeSingle()

        return {
          ...studentData,
          current_stage: pipelineData?.current_stage_id || 'lead',
          pipeline_stage_name: 'Lead',
        }
      },
      staleTime: 5 * 60 * 1000, // Cache 5 phút
      gcTime: 10 * 60 * 1000,   // Giữ trong memory 10 phút
    })
  }, [queryClient, supabase])

  /**
   * Prefetch danh sách students với filters cụ thể
   * Hữu ích khi user hay switch giữa các filter
   */
  const prefetchStudentsWithFilter = useCallback((filters: {
    status?: string
    stage?: string
    counselorId?: string
  }) => {
    const queryKey = ['students', filters]
    
    // Chỉ prefetch nếu chưa có
    const existingData = queryClient.getQueryData(queryKey)
    if (existingData) return

    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        let query = supabase
          .from('students')
          .select('*')

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        if (filters.counselorId) {
          query = query.eq('counselor_id', filters.counselorId)
        }

        const { data: studentsData, error } = await query
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch pipeline data
        if (studentsData && studentsData.length > 0) {
          const studentIds = studentsData.map(s => s.id)
          const { data: pipelineData } = await supabase
            .from('student_pipeline')
            .select('student_id, current_stage_id')
            .in('student_id', studentIds)

          const pipelineMap = new Map()
          pipelineData?.forEach((p: any) => {
            pipelineMap.set(p.student_id, p)
          })

          return studentsData.map((student: any) => ({
            ...student,
            current_stage: pipelineMap.get(student.id)?.current_stage_id || 'lead',
            pipeline_stage_name: 'Lead',
          }))
        }

        return studentsData || []
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })
  }, [queryClient, supabase])

  /**
   * Prefetch user profile
   * Hữu ích khi admin xem danh sách users và hover vào từng user
   */
  const prefetchUserProfile = useCallback((userId: string) => {
    const existingData = queryClient.getQueryData(['user-profile', userId])
    if (existingData) return

    queryClient.prefetchQuery({
      queryKey: ['user-profile', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data
      },
      staleTime: 10 * 60 * 1000, // Profile ít thay đổi → cache lâu hơn
      gcTime: 30 * 60 * 1000,
    })
  }, [queryClient, supabase])

  /**
   * Prefetch permissions của user
   */
  const prefetchUserPermissions = useCallback((userId: string) => {
    const existingData = queryClient.getQueryData(['user-permissions', userId])
    if (existingData) return

    queryClient.prefetchQuery({
      queryKey: ['user-permissions', userId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc(
          'get_user_permissions',
          { user_id: userId }
        )

        if (error) throw error
        return data || []
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    })
  }, [queryClient, supabase])

  /**
   * Prefetch knowledge articles với search query
   * Hữu ích cho autocomplete/search suggestions
   */
  const prefetchKnowledgeSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return

    const queryKey = ['knowledge-search', searchQuery]
    const existingData = queryClient.getQueryData(queryKey)
    if (existingData) return

    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('knowledge_articles')
          .select('*')
          .ilike('title', `%${searchQuery}%`)
          .limit(10)

        if (error) throw error
        return data || []
      },
      staleTime: 2 * 60 * 1000, // Search results cache ngắn hơn
      gcTime: 5 * 60 * 1000,
    })
  }, [queryClient, supabase])

  return {
    prefetchStudent,
    prefetchStudentsWithFilter,
    prefetchUserProfile,
    prefetchUserPermissions,
    prefetchKnowledgeSearch,
  }
}
