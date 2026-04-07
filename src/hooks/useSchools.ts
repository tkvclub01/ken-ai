'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { School, SchoolInsert, SchoolUpdate, SchoolDocument, SchoolDocumentInsert, SchoolEmailTemplate, SchoolEmailTemplateInsert } from '@/types'
import { handleError, handleSupabaseError } from '@/lib/errors'
import { toast } from 'sonner'

/**
 * Hook to fetch all schools with optional filters
 */
export function useSchools(filters?: {
  partnership_status?: string
  country?: string
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('schools')
          .select('*')

        if (filters?.partnership_status) {
          query = query.eq('partnership_status', filters.partnership_status)
        }

        if (filters?.country) {
          query = query.eq('country', filters.country)
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (error) {
          console.error('Error fetching schools:', error)
          throw new Error(error.message)
        }

        // Fetch application counts for each school with pipeline integration
        const schoolNames = data?.map(s => s.name) || []
        
        let applicationsData: any[] = []
        if (schoolNames.length > 0) {
          // Join students with their pipeline stages
          const { data: appsData, error: appsError } = await supabase
            .from('students')
            .select(`
              target_school,
              status,
              current_stage,
              student_pipeline!inner(current_stage_id)
            `)
            .in('target_school', schoolNames)

          if (!appsError && appsData) {
            applicationsData = appsData
          }
        }

        // Transform data with application metrics
        const transformedData = data?.map((school: any) => {
          const schoolApplications = applicationsData.filter(
            (app: any) => app.target_school === school.name
          )
          
          const totalApplications = schoolApplications.length
          const pendingApplications = schoolApplications.filter(
            (app: any) => app.status === 'lead' || app.status === 'active'
          ).length
          const acceptedApplications = schoolApplications.filter(
            (app: any) => app.status === 'completed'
          ).length
          const rejectedApplications = schoolApplications.filter(
            (app: any) => app.status === 'inactive'
          ).length
          // Count students in visa stage from pipeline
          const visaProcessingApplications = schoolApplications.filter(
            (app: any) => app.current_stage === 'visa' || 
                         app.student_pipeline?.current_stage_id === 'visa'
          ).length

          return {
            ...school,
            metrics: {
              totalApplications,
              pendingApplications,
              acceptedApplications,
              rejectedApplications,
              visaProcessingApplications,
            }
          }
        })

        return transformedData as (School & { metrics: any })[]
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useSchools query failed:', appError)
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
 * Hook to fetch a single school by ID
 */
export function useSchool(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['school', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching school:', error)
          throw new Error(error.message)
        }

        return data as School
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useSchool query failed:', appError)
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
 * Hook to fetch school documents
 */
export function useSchoolDocuments(schoolId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['school-documents', schoolId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('school_documents')
          .select('*')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching school documents:', error)
          throw new Error(error.message)
        }

        return data || []
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useSchoolDocuments query failed:', appError)
        throw appError
      }
    },
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  })
}

/**
 * Hook to create a new school
 */
export function useCreateSchool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (school: SchoolInsert) => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .insert(school)
          .select()
          .single()

        if (error) {
          const appError = handleSupabaseError(error)
          console.error('Error creating school:', appError)
          throw appError
        }

        return data as School
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useCreateSchool mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.setQueryData(['school', data.id], data)
      toast.success('Tạo trường/đối tác thành công')
    },
    onError: (error: any) => {
      console.error('Failed to create school:', error.message)
      toast.error('Không thể tạo trường/đối tác', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to update a school
 */
export function useUpdateSchool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SchoolUpdate }) => {
      try {
        const { data: updatedData, error } = await supabase
          .from('schools')
          .update(data)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          const appError = handleSupabaseError(error)
          console.error('Error updating school:', appError)
          throw appError
        }

        return updatedData as School
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUpdateSchool mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.setQueryData(['school', variables.id], data)
      toast.success('Cập nhật thông tin thành công')
    },
    onError: (error: any) => {
      console.error('Failed to update school:', error.message)
      toast.error('Không thể cập nhật', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to delete a school
 */
export function useDeleteSchool() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('schools').delete().eq('id', id)
        
        if (error) {
          const appError = handleSupabaseError(error)
          console.error('Error deleting school:', appError)
          throw appError
        }
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useDeleteSchool mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.removeQueries({ queryKey: ['school', id] })
      toast.success('Đã xóa trường/đối tác')
    },
    onError: (error: any) => {
      console.error('Failed to delete school:', error.message)
      toast.error('Không thể xóa', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to upload a school document
 */
export function useUploadSchoolDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ schoolId, file, documentType }: { 
      schoolId: string
      file: File
      documentType: string
    }) => {
      try {
        // Upload file to storage
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `${schoolId}/${Date.now()}_${sanitizedFileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('school-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('school-documents')
          .getPublicUrl(filePath)

        // Create document record in database
        const { data, error } = await supabase
          .from('school_documents')
          .insert({
            school_id: schoolId,
            document_type: documentType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data as SchoolDocument
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUploadSchoolDocument mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['school-documents', variables.schoolId] })
      toast.success('Tải lên tài liệu thành công')
    },
    onError: (error: any) => {
      console.error('Failed to upload document:', error.message)
      toast.error('Không thể tải lên tài liệu', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to delete a school document
 */
export function useDeleteSchoolDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      try {
        // Delete from storage
        await supabase.storage
          .from('school-documents')
          .remove([filePath])

        // Delete from database
        const { error } = await supabase
          .from('school_documents')
          .delete()
          .eq('id', id)
        
        if (error) {
          throw new Error(error.message)
        }
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useDeleteSchoolDocument mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, variables) => {
      // Extract school_id from filePath (format: schoolId/filename)
      const schoolId = variables.filePath.split('/')[0]
      queryClient.invalidateQueries({ queryKey: ['school-documents', schoolId] })
      toast.success('Đã xóa tài liệu')
    },
    onError: (error: any) => {
      console.error('Failed to delete document:', error.message)
      toast.error('Không thể xóa tài liệu', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to fetch school email templates
 */
export function useSchoolEmailTemplates(schoolId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['school-email-templates', schoolId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('school_email_templates')
          .select('*')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching school email templates:', error)
          throw new Error(error.message)
        }

        return data as SchoolEmailTemplate[]
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useSchoolEmailTemplates query failed:', appError)
        throw appError
      }
    },
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  })
}

/**
 * Hook to create a school email template
 */
export function useCreateSchoolEmailTemplate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (template: SchoolEmailTemplateInsert) => {
      try {
        const { data, error } = await supabase
          .from('school_email_templates')
          .insert(template)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data as SchoolEmailTemplate
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useCreateSchoolEmailTemplate mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['school-email-templates', variables.school_id] })
      toast.success('Tạo mẫu email thành công')
    },
    onError: (error: any) => {
      console.error('Failed to create email template:', error.message)
      toast.error('Không thể tạo mẫu email', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to update a school email template
 */
export function useUpdateSchoolEmailTemplate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SchoolEmailTemplate> }) => {
      try {
        const { data: updatedData, error } = await supabase
          .from('school_email_templates')
          .update(data)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return updatedData as SchoolEmailTemplate
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUpdateSchoolEmailTemplate mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-email-templates', data.school_id] })
      toast.success('Cập nhật mẫu email thành công')
    },
    onError: (error: any) => {
      console.error('Failed to update email template:', error.message)
      toast.error('Không thể cập nhật mẫu email', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to delete a school email template
 */
export function useDeleteSchoolEmailTemplate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('school_email_templates')
          .delete()
          .eq('id', id)
        
        if (error) {
          throw new Error(error.message)
        }
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useDeleteSchoolEmailTemplate mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-email-templates'] })
      toast.success('Đã xóa mẫu email')
    },
    onError: (error: any) => {
      console.error('Failed to delete email template:', error.message)
      toast.error('Không thể xóa mẫu email', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}

/**
 * Hook to update school notes
 */
export function useUpdateSchoolNotes() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .update({ notes })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data as School
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUpdateSchoolNotes mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.setQueryData(['school', data.id], data)
      toast.success('Cập nhật ghi chú thành công')
    },
    onError: (error: any) => {
      console.error('Failed to update notes:', error.message)
      toast.error('Không thể cập nhật ghi chú', {
        description: error.message || 'Vui lòng thử lại'
      })
    },
  })
}
