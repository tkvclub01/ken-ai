'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Document, DocumentInsert } from '@/types'

export function useDocuments(filters?: {
  studentId?: string
  documentType?: string
  ocrStatus?: string
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      let query = supabase.from('documents').select('*')

      if (filters?.studentId) query = query.eq('student_id', filters.studentId)
      if (filters?.documentType) query = query.eq('document_type', filters.documentType)
      if (filters?.ocrStatus) query = query.eq('ocr_status', filters.ocrStatus)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as Document[]
    },
  })
}

export function useDocument(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Document
    },
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (document: DocumentInsert) => {
      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single()
      if (error) throw error
      return data as Document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentInsert> }) => {
      const { data: updatedData, error } = await supabase
        .from('documents')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updatedData as Document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document'] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      // Optimistically remove from cache
      queryClient.setQueryData(['document', deletedId], null)
    },
  })
}
