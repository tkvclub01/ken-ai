'use server'

import { createClient } from '@/lib/supabase/server'
import { generateAIResponse, streamAIResponse, draftEmail } from '@/lib/ai/gemini'
import { searchKnowledge } from './knowledge'
import { revalidatePath } from 'next/cache'

/**
 * Phase 6.2: Context-Aware AI Chat with Knowledge Base Integration
 */
export async function chatWithAI(
  message: string,
  conversationId?: string | null,
  studentId?: string | null
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Create new conversation if none provided
    let convId = conversationId
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          student_id: studentId || null,
          title: message.slice(0, 50),
        })
        .select()
        .single()
      
      convId = newConv?.id
    }

    // Search knowledge base for context
    const knowledgeResults = await searchKnowledge(message, { verified: true })
    const context = knowledgeResults.results?.slice(0, 3).map((r: any) => r.content).join('\n\n')

    // Get student data if provided
    let studentData = null
    if (studentId) {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      studentData = student
    }

    // Generate AI response with context
    const aiResponse = await generateAIResponse(message, context, studentData)

    // Save user message
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message,
      })

    // Save AI response
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          knowledge_used: knowledgeResults.results?.length > 0,
          student_context: !!studentData,
        },
      })

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId)

    return {
      success: true,
      conversationId: convId,
      response: aiResponse,
      sources: knowledgeResults.results?.slice(0, 3) || [],
    }
  } catch (error: any) {
    console.error('Chat error:', error)
    return {
      success: false,
      error: error.message,
      response: 'Sorry, I encountered an error. Please try again.',
    }
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return {
      success: true,
      messages: data || [],
    }
  } catch (error: any) {
    console.error('Get history error:', error)
    return {
      success: false,
      error: error.message,
      messages: [],
    }
  }
}

/**
 * Get all conversations for sidebar
 */
export async function getUserConversations() {
  try {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        students (full_name)
      `)
      .eq('user_id', user.data.user?.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return {
      success: true,
      conversations: data || [],
    }
  } catch (error: any) {
    console.error('Get conversations error:', error)
    return {
      success: false,
      error: error.message,
      conversations: [],
    }
  }
}

/**
 * Delete conversation
 */
export async function deleteConversation(conversationId: string) {
  try {
    const supabase = await createClient()

    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    revalidatePath('/chat')
    
    return {
      success: true,
      message: 'Conversation deleted',
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
 * Phase 6.3: Email Drafting Workflow
 */
export async function generateEmailDraft(
  purpose: string,
  studentId?: string,
  additionalInfo?: string
) {
  try {
    const supabase = await createClient()

    // Get student data
    let studentData = null
    if (studentId) {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      studentData = student
    }

    // Generate email using AI
    const emailDraft = await draftEmail(purpose, studentData, additionalInfo)

    // Parse email into subject and body
    const lines = emailDraft.split('\n')
    let subject = ''
    let bodyStartIndex = 0

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('subject:') || lines[i].toLowerCase().includes('re:')) {
        subject = lines[i].replace(/subject:/i, '').trim()
        bodyStartIndex = i + 1
        break
      }
    }

    const body = lines.slice(bodyStartIndex).join('\n').trim()

    return {
      success: true,
      subject,
      body,
      fullDraft: emailDraft,
    }
  } catch (error: any) {
    console.error('Email draft error:', error)
    return {
      success: false,
      error: error.message,
      subject: '',
      body: '',
      fullDraft: '',
    }
  }
}

/**
 * Save email template
 */
export async function saveEmailTemplate(data: {
  name: string
  subjectTemplate: string
  bodyTemplate: string
  category?: string
  variables?: string[]
}) {
  try {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()

    const { data: result, error } = await supabase
      .from('email_templates')
      .insert({
        name: data.name,
        subject_template: data.subjectTemplate,
        body_template: data.bodyTemplate,
        category: data.category || null,
        variables: data.variables || [],
        created_by: user.data.user?.id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/email-templates')
    
    return {
      success: true,
      templateId: result.id,
      message: 'Template saved successfully',
    }
  } catch (error: any) {
    console.error('Save template error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get email templates
 */
export async function getEmailTemplates(category?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      templates: data || [],
    }
  } catch (error: any) {
    console.error('Get templates error:', error)
    return {
      success: false,
      error: error.message,
      templates: [],
    }
  }
}
