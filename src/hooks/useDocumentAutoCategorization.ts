'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface DocumentClassification {
  documentType: string
  confidence: number
  suggestedCategory?: string
  extractedFields?: Record<string, any>
}

export interface ClassificationResult {
  success: boolean
  classifications: DocumentClassification[]
  errors: Array<{ documentId: string; error: string }>
}

/**
 * Hook for AI-powered document auto-categorization
 * Uses Google Gemini Vision API to classify documents
 */
export function useDocumentAutoCategorization() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  /**
   * Classify a single document using AI
   */
  const classifyDocument = useMutation({
    mutationFn: async (documentId: string): Promise<DocumentClassification> => {
      // Fetch document metadata
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchError || !document) {
        throw new Error('Document not found')
      }

      // Call Edge Function for AI classification
      const { data, error } = await supabase.functions.invoke(
        'classify-document',
        {
          body: {
            documentId,
            fileUrl: document.file_url,
            documentType: document.document_type,
          },
        }
      )

      if (error) {
        throw new Error(error.message || 'Classification failed')
      }

      return data.classification as DocumentClassification
    },
    onSuccess: async (classification, documentId) => {
      // Update document with classification if confidence is high
      if (classification.confidence > 0.8) {
        // Fetch current metadata first
        const { data: currentDoc } = await supabase
          .from('documents')
          .select('ocr_metadata')
          .eq('id', documentId)
          .single()

        await supabase
          .from('documents')
          .update({
            document_type: classification.documentType,
            ocr_metadata: {
              ...(currentDoc?.ocr_metadata || {}),
              ai_classification: classification,
            },
          })
          .eq('id', documentId)

        queryClient.invalidateQueries({ queryKey: ['documents'] })
        queryClient.invalidateQueries({ queryKey: ['document', documentId] })

        toast.success('Document classified', {
          description: `Detected as ${classification.documentType} (${Math.round(classification.confidence * 100)}% confidence)`,
        })
      } else {
        toast.info('Low confidence classification', {
          description: `Suggested: ${classification.documentType} (${Math.round(classification.confidence * 100)}%). Please verify manually.`,
        })
      }
    },
    onError: (error: any) => {
      toast.error('Classification failed', {
        description: error.message,
      })
    },
  })

  /**
   * Batch classify multiple documents
   */
  const batchClassify = useMutation({
    mutationFn: async (
      documentIds: string[]
    ): Promise<ClassificationResult> => {
      const result: ClassificationResult = {
        success: true,
        classifications: [],
        errors: [],
      }

      // Process in batches of 5 to avoid rate limits
      const batchSize = 5
      for (let i = 0; i < documentIds.length; i += batchSize) {
        const batch = documentIds.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (docId) => {
            try {
              const classification = await classifyDocument.mutateAsync(docId)
              result.classifications.push(classification)
            } catch (error: any) {
              result.errors.push({
                documentId: docId,
                error: error.message,
              })
              result.success = false
            }
          })
        )
      }

      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })

      if (result.success) {
        toast.success(
          `Successfully classified ${result.classifications.length} documents`
        )
      } else {
        toast.warning(
          `Partially completed: ${result.classifications.length} succeeded, ${result.errors.length} failed`
        )
      }
    },
    onError: (error: any) => {
      toast.error('Batch classification failed', {
        description: error.message,
      })
    },
  })

  /**
   * Get classification accuracy stats
   */
  const getClassificationStats = useMutation({
    mutationFn: async (): Promise<{
      totalClassified: number
      averageConfidence: number
      accuracyRate: number
    }> => {
      const { data, error } = await supabase.rpc('get_classification_stats')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })

  return {
    classifyDocument,
    batchClassify,
    getClassificationStats,
  }
}
