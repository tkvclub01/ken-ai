'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

/**
 * Task 4.3: Semantic Search API
 * Tìm kiếm tri thức bằng vector similarity
 */
export async function searchKnowledge(
  query: string,
  filters?: {
    category?: string
    tags?: string[]
    verified?: boolean
  }
) {
  try {
    const supabase = await createClient()

    // Handle empty query - return popular documents instead of generating embedding
    if (!query || query.trim() === '') {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('verified', true)
        .order('view_count', { ascending: false })
        .limit(10)

      if (error) throw error

      return {
        success: true,
        results: (data || []).map((doc: any) => ({
          ...doc,
          similarity: 0,
        })),
        query,
      }
    }

    // Generate embedding cho query
    const queryEmbedding = await generateEmbedding(query)

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error('Failed to generate query embedding')
    }

    // Call PostgreSQL function với vector search
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: queryEmbedding,
      match_count: 10,
      filter_category: filters?.category || null,
      filter_tags: filters?.tags || null,
      min_similarity: 0.5,
    })

    if (error) throw error

    // Increment view count cho kết quả
    if (data && data.length > 0) {
      await Promise.all(
        data.slice(0, 3).map((doc: any) =>
          supabase.rpc('increment_knowledge_view', { doc_id: doc.id })
        )
      )
    }

    return {
      success: true,
      results: data || [],
      query,
    }
  } catch (error: any) {
    console.error('Search error:', error)
    return {
      success: false,
      error: error.message,
      results: [],
    }
  }
}

/**
 * Add kiến thức mới vào database
 */
export async function addKnowledge(data: {
  title: string
  content: string
  category?: string
  tags?: string[]
  sourceUrl?: string
}) {
  try {
    const supabase = await createClient()
    
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    // Generate embedding
    const embedding = await generateEmbedding(`${data.title}\n\n${data.content}`)

    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate embedding')
    }

    const { data: result, error } = await supabase
      .from('knowledge_base')
      .insert({
        title: data.title,
        content: data.content,
        embedding,
        category: data.category || null,
        tags: data.tags || [],
        source_url: data.sourceUrl || null,
        verified: false,
        created_by: userId || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/knowledge')
    
    return {
      success: true,
      documentId: result.id,
      message: 'Knowledge added successfully',
    }
  } catch (error: any) {
    console.error('Add knowledge error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update kiến thức từ feedback
 * Task 4.4: Feedback Loop - Auto-Learning
 */
export async function updateKnowledgeFromFeedback(
  documentId: string,
  updates: {
    title?: string
    content?: string
    tags?: string[]
    isHelpful?: boolean
  }
) {
  try {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}

    if (updates.title) updateData.title = updates.title
    if (updates.content) updateData.content = updates.content
    if (updates.tags) updateData.tags = updates.tags
    
    // If content changed, regenerate embedding
    if (updates.content) {
      const embedding = await generateEmbedding(updates.content)
      if (embedding) {
        updateData.embedding = embedding
        updateData.updated_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('knowledge_base')
      .update(updateData)
      .eq('id', documentId)

    if (error) throw error

    // Increment helpful count if marked as helpful
    if (updates.isHelpful) {
      await supabase.rpc('increment_knowledge_helpful', { doc_id: documentId })
    }

    revalidatePath('/knowledge')
    
    return {
      success: true,
      message: 'Knowledge updated from feedback',
    }
  } catch (error: any) {
    console.error('Update feedback error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get statistics về knowledge base
 */
export async function getKnowledgeStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_knowledge_base_stats')

    if (error) throw error

    return {
      success: true,
      stats: data,
    }
  } catch (error: any) {
    console.error('Get stats error:', error)
    return {
      success: false,
      error: error.message,
      stats: null,
    }
  }
}

/**
 * Verify knowledge base entry (admin only)
 */
export async function verifyKnowledge(documentId: string, verified: boolean) {
  try {
    const supabase = await createClient()

    const user = await supabase.auth.getUser()
    
    // Check if user is admin or manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.data.user?.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      throw new Error('Unauthorized: Only admins and managers can verify knowledge')
    }

    const { error } = await supabase
      .from('knowledge_base')
      .update({
        verified,
        verified_by: user.data.user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (error) throw error

    revalidatePath('/knowledge')
    
    return {
      success: true,
      message: `Knowledge ${verified ? 'verified' : 'unverified'} successfully`,
    }
  } catch (error: any) {
    console.error('Verify error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete knowledge base entry
 */
export async function deleteKnowledge(documentId: string) {
  try {
    const supabase = await createClient()

    const user = await supabase.auth.getUser()
    
    // Only admins can delete
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.data.user?.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete knowledge')
    }

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', documentId)

    if (error) throw error

    revalidatePath('/knowledge')
    
    return {
      success: true,
      message: 'Knowledge deleted successfully',
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Upload and process document/image for knowledge ingestion
 */
export async function uploadKnowledgeFile(
  file: File,
  categoryId?: string
) {
  try {
    const supabase = await createClient()
    
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `knowledge-uploads/${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents-original')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get signed URL for processing
    const { data: urlData } = await supabase.storage
      .from('documents-original')
      .createSignedUrl(filePath, 300) // 5 minutes expiry

    if (!urlData?.signedUrl) {
      throw new Error('Failed to generate file URL')
    }

    // Call Edge Function to process document
    const { data: processedData, error: processError } = await supabase.functions.invoke(
      'process-document',
      {
        body: {
          fileUrl: urlData.signedUrl,
          fileName: file.name,
          fileType: file.type,
          categoryId: categoryId || null,
        },
      }
    )

    if (processError) throw processError
    if (!processedData?.success) {
      throw new Error(processedData?.error || 'Document processing failed')
    }

    revalidatePath('/knowledge')

    return {
      success: true,
      knowledgeId: processedData.knowledgeId,
      title: processedData.title,
      sourceType: processedData.sourceType,
      chunksCreated: processedData.chunksCreated || 1,
      message: processedData.message || 'Document processed and added to knowledge base',
    }
  } catch (error: any) {
    console.error('Upload knowledge file error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
