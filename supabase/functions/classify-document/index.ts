// Supabase Edge Function for AI Document Classification
// Uses Google Gemini Vision API to classify document types

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId, fileUrl, documentType } = await req.json()

    if (!documentId || !fileUrl) {
      throw new Error('documentId and fileUrl are required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call Google Gemini Vision API for classification
    const classification = await classifyWithGemini(fileUrl, documentType)

    return new Response(
      JSON.stringify({
        success: true,
        classification,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in classify-document function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Classify document using Google Gemini Vision API
 */
async function classifyWithGemini(fileUrl: string, currentType?: string) {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured')
  }

  // Define document type categories
  const documentTypes = [
    'passport',
    'id_card',
    'academic_transcript',
    'diploma',
    'ielts_certificate',
    'toefl_certificate',
    'financial_statement',
    'recommendation_letter',
    'statement_of_purpose',
    'visa_approval',
    'other',
  ]

  // Create prompt for Gemini
  const prompt = `
Analyze this document image and classify it into one of these categories:
${documentTypes.map((t) => `- ${t}`).join('\n')}

Also extract key fields based on the document type.

Return JSON format:
{
  "documentType": "category_name",
  "confidence": 0.95,
  "extractedFields": {
    // Key-value pairs of extracted information
  }
}
`

  // Call Gemini Vision API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: await imageUrlToBase64(fileUrl),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const result = await response.json()
  const textResponse = result.candidates[0].content.parts[0].text

  // Parse JSON response
  try {
    const classification = JSON.parse(textResponse)
    return {
      documentType: classification.documentType || 'other',
      confidence: classification.confidence || 0.5,
      extractedFields: classification.extractedFields || {},
    }
  } catch (e) {
    // If parsing fails, return default classification
    return {
      documentType: currentType || 'other',
      confidence: 0.3,
      extractedFields: {},
    }
  }
}

/**
 * Convert image URL to Base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  )
  return base64
}
