import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { KnowledgeCategory, KnowledgeCategoryInsert, KnowledgeCategoryUpdate } from '@/types'
import { handleSupabaseError } from '@/lib/errors'

/**
 * Fetch all knowledge categories
 */
export function useKnowledgeCategories(filters?: {
  activeOnly?: boolean
}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['knowledge-categories', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('knowledge_categories')
          .select('*')
          .order('name', { ascending: true })

        if (filters?.activeOnly) {
          query = query.eq('is_active', true)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching knowledge categories:', error)
          throw new Error(error.message)
        }

        return data as KnowledgeCategory[]
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useKnowledgeCategories query failed:', appError)
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
 * Fetch a single knowledge category by ID
 */
export function useKnowledgeCategory(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['knowledge-category', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_categories')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching knowledge category:', error)
          throw new Error(error.message)
        }

        return data as KnowledgeCategory
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useKnowledgeCategory query failed:', appError)
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
 * Create a new knowledge category
 */
export function useCreateKnowledgeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData: KnowledgeCategoryInsert) => {
      try {
        const { data, error } = await supabase
          .from('knowledge_categories')
          .insert(categoryData)
          .select()
          .single()

        if (error) {
          console.error('Error creating knowledge category:', error)
          throw new Error(error.message)
        }

        return data as KnowledgeCategory
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useCreateKnowledgeCategory mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}

/**
 * Update an existing knowledge category
 */
export function useUpdateKnowledgeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: KnowledgeCategoryUpdate & { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('knowledge_categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Error updating knowledge category:', error)
          throw new Error(error.message)
        }

        return data as KnowledgeCategory
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useUpdateKnowledgeCategory mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch both the specific category and the list
      queryClient.invalidateQueries({ queryKey: ['knowledge-category', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}

/**
 * Delete a knowledge category
 */
export function useDeleteKnowledgeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('knowledge_categories')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting knowledge category:', error)
          throw new Error(error.message)
        }
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useDeleteKnowledgeCategory mutation failed:', appError)
        throw appError
      }
    },
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] })
    },
  })
}
