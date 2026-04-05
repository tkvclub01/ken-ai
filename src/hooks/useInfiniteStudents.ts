'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types'

const PAGE_SIZE = 20

/**
 * Hook fetch students với infinite scroll
 * Thay thế pagination truyền thống bằng load-on-demand
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteStudents({ status: 'active' })
 * 
 * // data.pages chứa mảng các pages
 * // data.pages.flatMap(page => page.students) để get all students
 * ```
 */
export function useInfiniteStudents(filters?: {
  status?: string
  stage?: string
  counselorId?: string
}) {
  const supabase = createClient()
  
  return useInfiniteQuery({
    queryKey: ['students-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Build query
      let query = supabase
        .from('students')
        .select('*')
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.counselorId) {
        query = query.eq('counselor_id', filters.counselorId)
      }
      
      // Fetch students
      const { data: studentsData, error: studentsError } = await query
      
      if (studentsError) {
        console.error('Error fetching students:', studentsError)
        throw new Error(studentsError.message)
      }
      
      if (!studentsData || studentsData.length === 0) {
        return {
          students: [] as Student[],
          nextPage: undefined,
        }
      }
      
      // Fetch pipeline data for these students
      const studentIds = studentsData.map(s => s.id)
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('student_pipeline')
        .select('student_id, current_stage_id')
        .in('student_id', studentIds)
      
      if (pipelineError) {
        console.error('Error fetching pipeline:', pipelineError)
        // Continue without pipeline data
      }
      
      // Create pipeline map
      const pipelineMap = new Map()
      pipelineData?.forEach((p: any) => {
        pipelineMap.set(p.student_id, p)
      })
      
      // Transform data
      const transformedData = studentsData.map((student: any) => {
        const pipeline = pipelineMap.get(student.id)
        return {
          ...student,
          current_stage: pipeline?.current_stage_id || 'lead',
          pipeline_stage_name: 'Lead',
        }
      })
      
      // Filter by stage after transformation if needed
      let finalData = transformedData
      if (filters?.stage) {
        finalData = transformedData.filter((s: any) => s.current_stage === filters.stage)
      }
      
      return {
        students: finalData as Student[],
        nextPage: studentsData.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    initialPageParam: 0,
    retry: 2,
  })
}
