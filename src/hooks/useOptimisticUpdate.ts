'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Generic helper for optimistic updates
 * Provides consistent pattern for all mutations
 * 
 * @example
 * ```ts
 * const mutation = useMutation({
 *   mutationFn: updateStudent,
 *   ...createOptimisticUpdate(
 *     ['students'],
 *     (old, newData) => old.map(s => s.id === newData.id ? { ...s, ...newData } : s)
 *   )
 * })
 * ```
 */
export function createOptimisticUpdate<TData, TVariables = any>(
  queryKey: string[],
  updateFn: (old: TData | undefined, variables: TVariables) => TData | undefined,
  options?: {
    rollbackMessage?: string
    successMessage?: string
    invalidateOnSettled?: boolean
  }
) {
  const queryClient = useQueryClient()
  const {
    rollbackMessage = 'Dữ liệu đã được khôi phục',
    successMessage,
    invalidateOnSettled = true,
  } = options || {}

  return {
    // Optimistic update before server confirms
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: TData | undefined) => 
        updateFn(old, variables)
      )

      // Return context with snapshot for rollback
      return { previousData }
    },

    // Rollback on error
    onError: (err: any, variables: TVariables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      toast.error('Thao tác thất bại', {
        description: rollbackMessage,
        duration: 5000,
      })

      console.error('Mutation failed:', err)
    },

    // Refetch after mutation completes
    onSettled: (data: any, error: any, variables: TVariables) => {
      if (invalidateOnSettled) {
        queryClient.invalidateQueries({ queryKey })
      }

      if (data && successMessage) {
        toast.success(successMessage)
      }
    },
  }
}

/**
 * Helper for list-based optimistic updates
 * Specifically designed for array data with ID-based updates
 */
export function createListOptimisticUpdate<TItem extends { id: string }>(
  queryKey: string[],
  options?: {
    rollbackMessage?: string
    successMessage?: string
  }
) {
  return createOptimisticUpdate<TItem[], Partial<TItem>>(
    queryKey,
    (old, newData) => {
      if (!old) return old
      return old.map(item => 
        item.id === (newData as any).id 
          ? { ...item, ...newData } 
          : item
      )
    },
    options
  )
}

/**
 * Helper for adding new items to a list optimistically
 */
export function createAddToListOptimisticUpdate<TItem>(
  queryKey: string[],
  getId: (item: TItem) => string,
  options?: {
    rollbackMessage?: string
    successMessage?: string
  }
) {
  return createOptimisticUpdate<TItem[], TItem>(
    queryKey,
    (old, newItem) => {
      if (!old) return [newItem]
      return [...old, newItem]
    },
    options
  )
}

/**
 * Helper for removing items from a list optimistically
 */
export function createRemoveFromListOptimisticUpdate<TItem extends { id: string }>(
  queryKey: string[],
  options?: {
    rollbackMessage?: string
    successMessage?: string
  }
) {
  const queryClient = useQueryClient()
  
  return {
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<TItem[]>(queryKey)

      queryClient.setQueryData(queryKey, (old: TItem[] | undefined) => {
        if (!old) return old
        return old.filter(item => item.id !== itemId)
      })

      return { previousData }
    },

    onError: (err: any, variables: string, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      toast.error('Xóa thất bại', {
        description: options?.rollbackMessage || 'Dữ liệu đã được khôi phục',
        duration: 5000,
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      
      if (options?.successMessage) {
        toast.success(options.successMessage)
      }
    },
  }
}
