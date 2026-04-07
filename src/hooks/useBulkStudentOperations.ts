'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types'
import { handleError } from '@/lib/errors'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'

export interface BulkOperationResult {
  success: boolean
  succeededCount: number
  failedCount: number
  errors: Array<{ id: string; error: string }>
}

export interface OperationProgress {
  total: number
  completed: number
  current: string | null
  status: 'idle' | 'processing' | 'completed' | 'error'
}

const BULK_DELETE_LIMIT = 50 // Maximum students that can be deleted at once
const VALID_STATUSES = ['lead', 'active', 'inactive', 'completed', 'rejected']

/**
 * Hook for bulk operations on students
 * Provides optimistic updates and progress tracking
 */
export function useBulkStudentOperations() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null)
  const [lastOperationResult, setLastOperationResult] = useState<BulkOperationResult | null>(null)

  // Reset progress tracking
  const resetProgress = useCallback(() => {
    setOperationProgress(null)
    setLastOperationResult(null)
  }, [])

  // Update progress tracker
  const updateProgress = useCallback((completed: number, total: number, current?: string) => {
    setOperationProgress({
      total,
      completed,
      current: current || null,
      status: completed === total ? 'completed' : 'processing',
    })
  }, [])

  /**
   * Bulk assign counselor to students
   */
  const bulkAssignCounselor = useMutation({
    mutationFn: async ({
      studentIds,
      counselorId,
    }: {
      studentIds: string[]
      counselorId: string
    }): Promise<BulkOperationResult> => {
      if (!studentIds.length) {
        throw new Error('No students selected')
      }

      if (!counselorId) {
        throw new Error('Counselor ID is required')
      }

      const result: BulkOperationResult = {
        success: true,
        succeededCount: 0,
        failedCount: 0,
        errors: [],
      }

      updateProgress(0, studentIds.length)

      // Process in batches of 10 for better performance
      const batchSize = 10
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize)
        
        try {
          const { error } = await supabase
            .from('students')
            .update({ counselor_id: counselorId })
            .in('id', batch)

          if (error) {
            throw new Error(error.message)
          }

          result.succeededCount += batch.length
          updateProgress(result.succeededCount + result.failedCount, studentIds.length)
        } catch (error: any) {
          result.failedCount += batch.length
          result.errors.push(
            ...batch.map((id) => ({ id, error: error.message }))
          )
          result.success = false
        }
      }

      return result
    },
    onSuccess: (result) => {
      setLastOperationResult(result)
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['students'] })

      // Show appropriate toast
      if (result.success) {
        toast.success(`Successfully assigned counselor to ${result.succeededCount} students`)
      } else {
        toast.warning(
          `Partially completed: ${result.succeededCount} succeeded, ${result.failedCount} failed`
        )
      }

      // Reset progress after delay
      setTimeout(() => resetProgress(), 2000)
    },
    onError: (error: any) => {
      toast.error('Failed to assign counselor', {
        description: error.message,
      })
      setOperationProgress((prev) =>
        prev ? { ...prev, status: 'error' } : null
      )
    },
  })

  /**
   * Bulk update student status
   */
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({
      studentIds,
      status,
    }: {
      studentIds: string[]
      status: string
    }): Promise<BulkOperationResult> => {
      if (!studentIds.length) {
        throw new Error('No students selected')
      }

      if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`)
      }

      const result: BulkOperationResult = {
        success: true,
        succeededCount: 0,
        failedCount: 0,
        errors: [],
      }

      updateProgress(0, studentIds.length)

      try {
        const { error } = await supabase
          .from('students')
          .update({ status })
          .in('id', studentIds)

        if (error) {
          throw new Error(error.message)
        }

        result.succeededCount = studentIds.length
        updateProgress(studentIds.length, studentIds.length)
      } catch (error: any) {
        result.failedCount = studentIds.length
        result.errors = studentIds.map((id) => ({ id, error: error.message }))
        result.success = false
      }

      return result
    },
    onSuccess: (result) => {
      setLastOperationResult(result)
      queryClient.invalidateQueries({ queryKey: ['students'] })

      if (result.success) {
        toast.success(`Successfully updated status for ${result.succeededCount} students`)
      } else {
        toast.error('Failed to update status', {
          description: `${result.failedCount} students failed`,
        })
      }

      setTimeout(() => resetProgress(), 2000)
    },
    onError: (error: any) => {
      toast.error('Failed to update status', {
        description: error.message,
      })
    },
  })

  /**
   * Bulk delete students (with safety limit)
   */
  const bulkDeleteStudents = useMutation({
    mutationFn: async (studentIds: string[]): Promise<BulkOperationResult> => {
      if (!studentIds.length) {
        throw new Error('No students selected')
      }

      if (studentIds.length > BULK_DELETE_LIMIT) {
        throw new Error(
          `Cannot delete more than ${BULK_DELETE_LIMIT} students at once. Please delete in smaller batches.`
        )
      }

      const result: BulkOperationResult = {
        success: true,
        succeededCount: 0,
        failedCount: 0,
        errors: [],
      }

      updateProgress(0, studentIds.length)

      try {
        // Delete pipeline records first
        await supabase
          .from('student_pipeline')
          .delete()
          .in('student_id', studentIds)

        // Delete students
        const { error } = await supabase
          .from('students')
          .delete()
          .in('id', studentIds)

        if (error) {
          throw new Error(error.message)
        }

        result.succeededCount = studentIds.length
        updateProgress(studentIds.length, studentIds.length)
      } catch (error: any) {
        result.failedCount = studentIds.length
        result.errors = studentIds.map((id) => ({ id, error: error.message }))
        result.success = false
      }

      return result
    },
    onSuccess: (result) => {
      setLastOperationResult(result)
      queryClient.invalidateQueries({ queryKey: ['students'] })

      if (result.success) {
        toast.success(`Successfully deleted ${result.succeededCount} students`)
      } else {
        toast.error('Failed to delete some students', {
          description: `${result.failedCount} deletions failed`,
        })
      }

      setTimeout(() => resetProgress(), 2000)
    },
    onError: (error: any) => {
      toast.error('Failed to delete students', {
        description: error.message,
      })
    },
  })

  /**
   * Bulk export students to CSV
   */
  const bulkExportStudents = useMutation({
    mutationFn: async (studentIds: string[]): Promise<string> => {
      if (!studentIds.length) {
        throw new Error('No students selected for export')
      }

      // Fetch student data
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

      if (error) {
        throw new Error(error.message)
      }

      if (!students || students.length === 0) {
        throw new Error('No students found')
      }

      // Convert to CSV
      const headers = [
        'id',
        'full_name',
        'email',
        'phone',
        'passport_number',
        'nationality',
        'target_country',
        'intended_major',
        'gpa',
        'status',
        'counselor_id',
        'created_at',
      ]

      const csvRows = [
        headers.join(','), // Header row
        ...students.map((student: any) =>
          headers
            .map((header) => {
              const value = student[header]
              // Escape commas and quotes in values
              const escaped = String(value || '').replace(/"/g, '""')
              return `"${escaped}"`
            })
            .join(',')
        ),
      ]

      return csvRows.join('\n')
    },
    onSuccess: (csvData) => {
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export completed', {
        description: 'CSV file downloaded successfully',
      })
    },
    onError: (error: any) => {
      toast.error('Export failed', {
        description: error.message,
      })
    },
  })

  return {
    // Mutations
    bulkAssignCounselor,
    bulkUpdateStatus,
    bulkDeleteStudents,
    bulkExportStudents,

    // State
    operationProgress,
    lastOperationResult,

    // Utilities
    resetProgress,
  }
}
