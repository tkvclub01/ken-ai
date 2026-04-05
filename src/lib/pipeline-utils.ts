import { createClient } from '@/lib/supabase/client'

/**
 * Shared utility to fetch pipeline data for students
 * Eliminates code duplication across hooks
 */

interface PipelineData {
  student_id: string
  current_stage_id: string
}

/**
 * Fetch pipeline stage for multiple students
 * @param studentIds Array of student IDs
 * @returns Map of student_id -> pipeline data
 */
export async function fetchPipelineForStudents(
  studentIds: string[]
): Promise<Map<string, PipelineData>> {
  if (!studentIds || studentIds.length === 0) {
    return new Map()
  }

  const supabase = createClient()
  
  const { data: pipelineData, error } = await supabase
    .from('student_pipeline')
    .select('student_id, current_stage_id')
    .in('student_id', studentIds)

  if (error) {
    console.error('Error fetching pipeline data:', error)
    return new Map()
  }

  const pipelineMap = new Map<string, PipelineData>()
  pipelineData?.forEach((p: PipelineData) => {
    pipelineMap.set(p.student_id, p)
  })

  return pipelineMap
}

/**
 * Fetch pipeline stage for a single student
 * @param studentId Student ID
 * @returns Pipeline data or null if not found
 */
export async function fetchPipelineForStudent(
  studentId: string
): Promise<PipelineData | null> {
  if (!studentId) {
    return null
  }

  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('student_pipeline')
    .select('student_id, current_stage_id')
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching pipeline data:', error)
    return null
  }

  return data as PipelineData | null
}
