import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Use anon key with user's JWT for RLS enforcement
    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Validate authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Valid authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = user.id

    const { title, content, category, tags, sourceUrl } = await req.json()

    if (!title || !content) {
      throw new Error('Missing required fields: title or content')
    }

    // Generate embedding using Gemini API
    const geminiApiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Prepare text for embedding
    const textForEmbedding = `${title}\n\n${content}`.slice(0, 8000) // Limit to avoid token limits

    // Call Google's embedding API
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [{ text: textForEmbedding }]
          }
        }),
      }
    )

    const embeddingData = await embeddingResponse.json()

    if (!embeddingData.embedding || !embeddingData.embedding.values) {
      console.error('Embedding response:', embeddingData)
      throw new Error('Failed to generate embedding')
    }

    const embedding = embeddingData.embedding.values

    // Insert into knowledge base
    const { data, error } = await supabaseClient
      .from('knowledge_base')
      .insert({
        title,
        content,
        embedding,
        category: category || null,
        tags: tags || [],
        source_url: sourceUrl || null,
        verified: false, // Requires admin verification
        created_by: userId || null,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        documentId: data.id,
        message: 'Knowledge base entry created successfully',
        embedding_dimension: embedding.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in knowledge ingestion:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
