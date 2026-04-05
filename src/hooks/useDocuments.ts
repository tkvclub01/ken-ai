'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Document, DocumentInsert } from '@/types'
import { useMemo } from 'react'
import { handleSupabaseError } from '@/lib/errors'

export function useDocuments(filters?: {
  studentId?: string
  documentType?: string
  ocrStatus?: string
}) {
  const supabase = createClient()
  
  // Stabilize filters object reference
  const stableFilters = useMemo(() => filters || {}, [
    filters?.studentId,
    filters?.documentType,
    filters?.ocrStatus
  ])

  return useQuery({
    queryKey: ['documents', stableFilters],
    queryFn: async () => {
      let query = supabase.from('documents').select('*')

      if (filters?.studentId) query = query.eq('student_id', filters.studentId)
      if (filters?.documentType) query = query.eq('document_type', filters.documentType)
      if (filters?.ocrStatus) query = query.eq('ocr_status', filters.ocrStatus)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as Document[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.setQueryData(['document', data.id], data)
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
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
      queryClient.setQueryData(['document', variables.id], updatedData)
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
