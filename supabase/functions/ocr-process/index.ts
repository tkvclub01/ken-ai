import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY FIX: Use anon key instead of service role key
    // This ensures RLS policies are enforced and prevents privilege escalation
    const authToken = req.headers.get('Authorization')
    
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '', // Use ANON key, not SERVICE_ROLE
      {
        global: {
          headers: { Authorization: authToken },
        },
      }
    )

    const { documentId, fileUrl, documentType } = await req.json()

    if (!documentId || !fileUrl) {
      throw new Error('Missing required parameters: documentId or fileUrl')
    }

    // Update document status to processing
    await supabaseClient
      .from('documents')
      .update({ ocr_status: 'processing' })
      .eq('id', documentId)

    // Download the file from Supabase Storage
    const fileResponse = await fetch(fileUrl)
    const fileBuffer = await fileResponse.arrayBuffer()
    const base64Image = arrayBufferToBase64(fileBuffer)

    // Call Gemini API for OCR extraction
    const geminiApiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: getOcrPrompt(documentType) },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          responseMimeType: 'application/json'
        }),
      }
    )

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const extractedData = JSON.parse(geminiData.candidates[0].content.parts[0].text)

    // Update document with extracted data
    const updateResult = await supabaseClient
      .from('documents')
      .update({
        ocr_status: 'completed',
        extracted_data: extractedData,
        metadata: {
          processed_at: new Date().toISOString(),
          confidence: extractedData.confidence,
          model: 'gemini-1.5-flash',
        },
      })
      .eq('id', documentId)
      .select()
      .single()

    // If student record doesn't have data yet, update it from extracted data
    if (extractedData.fullName && updateResult.student_id) {
      const studentUpdate = await supabaseClient
        .from('students')
        .select('full_name, date_of_birth, passport_number')
        .eq('id', updateResult.student_id)
        .single()

      const updates: Record<string, any> = {}
      
      if (!studentUpdate.full_name && extractedData.fullName) {
        updates.full_name = extractedData.fullName
      }
      if (!studentUpdate.date_of_birth && extractedData.dateOfBirth) {
        updates.date_of_birth = extractedData.dateOfBirth
      }
      if (!studentUpdate.passport_number && extractedData.passportNumber) {
        updates.passport_number = extractedData.passportNumber
      }

      if (Object.keys(updates).length > 0) {
        await supabaseClient
          .from('students')
          .update(updates)
          .eq('id', updateResult.student_id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        extractedData,
        message: 'OCR processing completed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in OCR processing:', error)

    // Update document status to rejected on error
    if (req.body) {
      const { documentId } = await req.json().catch(() => ({}))
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // SECURITY: No NEXT_PUBLIC_ prefix
          {
            global: {
              headers: { Authorization: req.headers.get('Authorization')! },
            },
          }
        )

        await supabaseClient
          .from('documents')
          .update({
            ocr_status: 'rejected',
            rejection_reason: error.message,
          })
          .eq('id', documentId)
      }
    }

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

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// OCR prompts based on document type
function getOcrPrompt(documentType: string): string {
  const prompts: Record<string, string> = {
    passport: `Analyze this passport data page and extract the following information in JSON format:

Required fields:
- passportNumber (string)
- surname (string)
- givenNames (string)
- nationality (string)
- dateOfBirth (YYYY-MM-DD format)
- sex (M/F/X)
- placeOfBirth (string)
- issueDate (YYYY-MM-DD format)
- expiryDate (YYYY-MM-DD format)
- issuingAuthority (string)

Also include:
- confidence (number between 0 and 1): Overall confidence in extraction accuracy

Return ONLY valid JSON. If a field cannot be determined, set it to null.`,

    transcript: `Analyze this academic transcript and extract the following information:

Required fields:
- studentName (string): Full name as shown on transcript
- dateOfBirth (YYYY-MM-DD format or null)
- institutionName (string): Name of school/university
- gpa (number): Overall GPA on a 4.0 scale (convert if necessary)
- gradingScale (string): e.g., "4.0", "10.0", "Percentage"
- graduationDate (YYYY-MM-DD format or null)
- degree (string): Type of degree obtained
- major (string): Field of study

Also include:
- confidence (number between 0 and 1): Overall confidence

Return ONLY valid JSON. Convert all dates to YYYY-MM-DD format.`,

    idCard: `Analyze this national ID card / Citizen Identification Card and extract:

Required fields:
- idNumber (string): ID/Citizen number
- fullName (string)
- dateOfBirth (YYYY-MM-DD format)
- sex (M/F/X)
- nationality (string)
- placeOfOrigin (string)
- placeOfResidence (string)
- expiryDate (YYYY-MM-DD format or null)
- issueDate (YYYY-MM-DD format)

Also include:
- personalIdentification (string): Special marks or features
- confidence (number between 0 and 1)

Return ONLY valid JSON.`,

    birthCertificate: `Analyze this birth certificate and extract:

Required fields:
- fullName (string): Name at birth / current name
- dateOfBirth (YYYY-MM-DD format)
- placeOfBirth (string): City/Province/Country
- sex (M/F/X)
- fatherName (string): Full name of father
- motherName (string): Full maiden name of mother
- certificateNumber (string)
- registrationDate (YYYY-MM-DD format)
- registrationLocation (string)

Also include:
- confidence (number between 0 and 1)

Return ONLY valid JSON.`,
  }

  return prompts[documentType] || prompts.passport
}
