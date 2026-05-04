'use server'

import { createClient } from '@/lib/supabase/server'
import { extractDocumentData, classifyDocument, aggregateStudentProfile } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

interface UploadedFile {
  file: File
  studentId: string
  documentType?: string // Optional: user-provided type override
}

interface ProcessingResult {
  fileId: string
  fileName: string
  documentType: string
  extractedData: any
  status: 'success' | 'error'
  error?: string
}

interface BatchUploadResult {
  success: boolean
  results: ProcessingResult[]
  aggregatedProfile?: any
  message?: string
}

/**
 * Process multiple documents with AI classification and profile aggregation
 */
export async function processMultipleDocuments(
  files: UploadedFile[]
): Promise<BatchUploadResult> {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id

  if (!userId) {
    return {
      success: false,
      results: [],
      message: 'Unauthorized',
    }
  }

  const results: ProcessingResult[] = []
  const extractedProfiles: any[] = []

  try {
    // Process each file sequentially to avoid overwhelming the AI API
    for (const uploadedFile of files) {
      const { file, studentId, documentType: userProvidedType } = uploadedFile

      try {
        // Step 1: Upload file to storage
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `${studentId}/${Date.now()}_${sanitizedFileName}`

        const { error: uploadError } = await supabase.storage
          .from('student-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) {
          results.push({
            fileId: '',
            fileName: file.name,
            documentType: 'unknown',
            extractedData: null,
            status: 'error',
            error: `Upload failed: ${uploadError.message}`,
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('student-documents')
          .getPublicUrl(filePath)

        // Step 2: Create initial document record with 'processing' status
        const { data: docRecord, error: insertError } = await supabase
          .from('documents')
          .insert({
            student_id: studentId,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
            file_size: file.size,
            mime_type: file.type,
            upload_status: 'uploaded',
            ocr_status: 'processing',
            document_category: userProvidedType || 'pending_classification',
          })
          .select()
          .single()

        if (insertError) {
          results.push({
            fileId: '',
            fileName: file.name,
            documentType: 'unknown',
            extractedData: null,
            status: 'error',
            error: `Database insert failed: ${insertError.message}`,
          })
          continue
        }

        // Step 3: Convert file to base64 for OCR processing
        const fileBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(fileBuffer).toString('base64')
        const dataUri = `data:${file.type};base64,${base64}`

        // Step 4: Extract data using OCR/AI
        const extractedData = await extractDocumentData(dataUri, file.name)

        // Step 5: AI-powered document classification (if user didn't specify)
        let finalDocumentType = userProvidedType || 'other'
        if (!userProvidedType && extractedData) {
          const classification = await classifyDocument(extractedData, file.name, file.type)
          finalDocumentType = classification.documentType
        }

        // Step 6: Update document record with OCR results and classification
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            ocr_status: 'completed',
            ocr_data: extractedData,
            document_category: finalDocumentType,
            metadata: {
              classifiedBy: 'ai',
              confidence: extractedData?.confidence || 0,
              processedAt: new Date().toISOString(),
            },
          })
          .eq('id', docRecord.id)

        if (updateError) {
          console.error('Failed to update document with OCR data:', updateError)
          // Don't fail the whole process, just log the error
        }

        // Collect extracted profile data for aggregation
        if (extractedData) {
          extractedProfiles.push({
            fileName: file.name,
            documentType: finalDocumentType,
            data: extractedData,
          })
        }

        results.push({
          fileId: docRecord.id,
          fileName: file.name,
          documentType: finalDocumentType,
          extractedData,
          status: 'success',
        })
      } catch (error: any) {
        console.error(`Error processing file ${file.name}:`, error)
        results.push({
          fileId: '',
          fileName: file.name,
          documentType: 'unknown',
          extractedData: null,
          status: 'error',
          error: error.message || 'Unknown error',
        })
      }
    }

    // Step 7: Aggregate student profile from all processed documents
    const successfulResults = results.filter(r => r.status === 'success')
    let aggregatedProfile = null

    if (successfulResults.length > 0) {
      const firstStudentId = files[0]?.studentId
      if (firstStudentId) {
        aggregatedProfile = await aggregateStudentProfile(extractedProfiles, firstStudentId)

        // Update student record with aggregated data
        if (aggregatedProfile && Object.keys(aggregatedProfile).length > 0) {
          const { error: studentUpdateError } = await supabase
            .from('students')
            .update({
              ...aggregatedProfile,
              updated_at: new Date().toISOString(),
            })
            .eq('id', firstStudentId)

          if (studentUpdateError) {
            console.error('Failed to update student with aggregated profile:', studentUpdateError)
          }
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/students`)
    revalidatePath(`/students/${files[0]?.studentId}`)

    const hasErrors = results.some(r => r.status === 'error')

    return {
      success: !hasErrors,
      results,
      aggregatedProfile,
      message: hasErrors
        ? `${successfulResults.length}/${results.length} files processed successfully`
        : `All ${results.length} files processed successfully`,
    }
  } catch (error: any) {
    console.error('Batch document processing error:', error)
    return {
      success: false,
      results: [],
      message: error.message || 'Failed to process documents',
    }
  }
}

/**
 * Allow user to manually override AI classification
 */
export async function updateDocumentClassification(
  documentId: string,
  documentType: string
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('documents')
      .update({
        document_category: documentType,
        metadata: {
          classifiedBy: 'manual',
          updatedAt: new Date().toISOString(),
        },
      })
      .eq('id', documentId)

    if (error) throw error

    revalidatePath('/students')

    return {
      success: true,
      message: 'Document classification updated',
    }
  } catch (error: any) {
    console.error('Update classification error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get processing status for a batch of documents
 */
export async function getBatchProcessingStatus(documentIds: string[]) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, ocr_status, document_category, ocr_data')
      .in('id', documentIds)

    if (error) throw error

    return {
      success: true,
      documents: data || [],
    }
  } catch (error: any) {
    console.error('Get batch status error:', error)
    return {
      success: false,
      error: error.message,
      documents: [],
    }
  }
}
