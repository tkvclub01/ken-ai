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
    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // SECURITY: No NEXT_PUBLIC_ prefix
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { fileUrl, fileName, fileType, categoryId } = await req.json()

    if (!fileUrl || !fileName) {
      throw new Error('Missing required parameters: fileUrl or fileName')
    }

    console.log(`Processing file: ${fileName}, type: ${fileType}`)

    let extractedText = ''
    let sourceType = 'document'

    // Determine file type and extract text accordingly
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    if (['png', 'jpg', 'jpeg', 'webp'].includes(fileExtension || '')) {
      // Image file - use OCR
      sourceType = 'image'
      console.log('Processing image with OCR...')
      extractedText = await processImageWithOCR(fileUrl)
    } else if (fileExtension === 'pdf') {
      // PDF file
      sourceType = 'pdf'
      console.log('Processing PDF...')
      extractedText = await extractTextFromPDF(fileUrl)
    } else if (['txt', 'md'].includes(fileExtension || '')) {
      // Plain text file
      sourceType = 'text'
      console.log('Processing text file...')
      extractedText = await extractTextFromFile(fileUrl)
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the file')
    }

    console.log(`Extracted ${extractedText.length} characters`)

    // Generate title from first few lines or filename
    const title = generateTitle(extractedText, fileName)

    // Decide whether to use chunking based on document length
    // Documents > 2000 chars benefit from chunking
    if (extractedText.length > 2000) {
      console.log('Document is large, using semantic chunking...')
      
      // Process with chunking - creates multiple knowledge entries
      const results = await processDocumentWithChunking(
        extractedText,
        fileName,
        categoryId,
        sourceType
      )
      
      // Return first result as primary (UI expects single result)
      return new Response(
        JSON.stringify({
          success: true,
          knowledgeId: results[0].id,
          title: results[0].title,
          sourceType,
          characterCount: extractedText.length,
          chunksCreated: results.length,
          message: `Document processed and split into ${results.length} chunks for better search`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      // Short document - single embedding is sufficient
      console.log('Generating single embedding for short document...')
      const embedding = await generateEmbedding(`${title}\n\n${extractedText}`)

      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding for content')
      }

      console.log(`Embedding generated: ${embedding.length} dimensions`)

      // Store in knowledge_base table with embedding
      const insertData: any = {
        title,
        content: extractedText,
        embedding,
        tags: [sourceType, fileExtension || 'unknown'],
        source_url: fileUrl,
        metadata: {
          source_type: sourceType,
          original_filename: fileName,
          processed_at: new Date().toISOString(),
          model: 'gemini-text-embedding-004',
        },
        verified: false,
      }

      // Use category_id if provided (new schema), otherwise fall back to category text
      if (categoryId) {
        insertData.category_id = categoryId
      }

      const { data: knowledgeData, error: insertError } = await supabaseClient
        .from('knowledge_base')
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      console.log(`Knowledge entry created: ${knowledgeData.id}`)

      return new Response(
        JSON.stringify({
          success: true,
          knowledgeId: knowledgeData.id,
          title: knowledgeData.title,
          sourceType,
          characterCount: extractedText.length,
          chunksCreated: 1,
          message: 'Document processed and added to knowledge base',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
  } catch (error) {
    console.error('Error in document processing:', error)

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

/**
 * Process image with Google Gemini OCR
 */
async function processImageWithOCR(fileUrl: string): Promise<string> {
  try {
    // Download the image
    const fileResponse = await fetch(fileUrl)
    const fileBuffer = await fileResponse.arrayBuffer()
    const base64Image = arrayBufferToBase64(fileBuffer)

    // Call Gemini API for OCR
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
              { 
                text: `Extract all text from this image exactly as it appears. Preserve formatting, line breaks, and structure. Return ONLY the extracted text without any additional commentary or explanation.` 
              },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    return geminiData.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('OCR processing error:', error)
    throw new Error(`OCR failed: ${error.message}`)
  }
}

/**
 * Extract text from PDF using simple text extraction
 * Note: For production, consider using a dedicated PDF parsing library
 */
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  try {
    // For now, we'll use a simple approach
    // In production, you'd want to use pdf-parse or similar
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()
    
    // Convert to base64 for Gemini processing
    const base64PDF = arrayBufferToBase64(buffer)

    const geminiApiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Use Gemini to extract text from PDF
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
              { 
                text: `Extract all text content from this PDF document. Preserve the structure, headings, and formatting. Return ONLY the extracted text without any additional commentary.` 
              },
              { inline_data: { mime_type: 'application/pdf', data: base64PDF } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API for PDF')
    }

    return geminiData.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error(`PDF extraction failed: ${error.message}`)
  }
}

/**
 * Extract text from plain text files
 */
async function extractTextFromFile(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)
    const text = await response.text()
    return text
  } catch (error) {
    console.error('Text file extraction error:', error)
    throw new Error(`Text extraction failed: ${error.message}`)
  }
}

/**
 * Generate a title from the first few lines of text
 */
function generateTitle(text: string, fileName: string): string {
  // Try to get first line or heading
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  if (lines.length > 0) {
    // Take first non-empty line, max 100 chars
    const firstLine = lines[0].trim()
    if (firstLine.length <= 100) {
      return firstLine
    }
    return firstLine.substring(0, 97) + '...'
  }

  // Fallback to filename
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
}

/**
 * Helper function to convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Split text into semantic chunks with overlap for better retrieval
 * Uses sentence boundaries to avoid cutting mid-sentence
 */
function semanticChunk(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  // Split by sentences (preserving delimiters)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const sentence of sentences) {
    // If adding this sentence exceeds max size, save current chunk
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      
      // Keep overlap for context continuity (last few words)
      const words = currentChunk.split(' ')
      const overlapWords = Math.floor(overlap / 5) // Approximate words from char count
      currentChunk = words.slice(-overlapWords).join(' ') + ' '
    }
    currentChunk += sentence + ' '
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  // Filter out tiny chunks (< 50 chars)
  return chunks.filter(chunk => chunk.length > 50)
}

/**
 * Process document with chunking - creates multiple knowledge entries
 * Each chunk gets its own embedding for better retrieval precision
 */
async function processDocumentWithChunking(
  extractedText: string,
  fileName: string,
  categoryId?: string,
  sourceType: string = 'document'
) {
  const chunks = semanticChunk(extractedText, 1000, 200)
  const baseTitle = generateTitle(extractedText, fileName)
  
  console.log(`Split document into ${chunks.length} chunks`)
  
  const results = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkTitle = chunks.length > 1 
      ? `${baseTitle} (Part ${i + 1}/${chunks.length})`
      : baseTitle
    
    console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
    
    // Generate embedding for this specific chunk
    const embedding = await generateEmbedding(chunk)
    
    if (!embedding || embedding.length === 0) {
      throw new Error(`Failed to generate embedding for chunk ${i + 1}`)
    }
    
    // Store chunk as separate knowledge entry
    const insertData: any = {
      title: chunkTitle,
      content: chunk,
      embedding,
      tags: ['chunked', sourceType, `part_${i + 1}`],
      source_url: null, // Individual chunks don't have separate URLs
      metadata: {
        source_type: 'chunked_document',
        original_filename: fileName,
        chunk_index: i,
        total_chunks: chunks.length,
        processed_at: new Date().toISOString(),
        model: 'gemini-text-embedding-004',
      },
      verified: false,
    }
    
    // Add category if provided
    if (categoryId) {
      insertData.category_id = categoryId
    }
    
    const { data, error } = await supabaseClient
      .from('knowledge_base')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error(`Error inserting chunk ${i + 1}:`, error)
      throw error
    }
    
    results.push(data)
  }
  
  console.log(`Successfully created ${results.length} knowledge chunks`)
  return results
}

/**
 * Generate embedding using Google's text-embedding-004 model
 * Returns 768-dimensional vector optimized for semantic search
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const geminiApiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Limit text to avoid token limits (8000 chars ~ 2000 tokens)
    const truncatedText = text.slice(0, 8000)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [{ text: truncatedText }]
          }
        }),
      }
    )

    const data = await response.json()

    if (!data.embedding || !data.embedding.values) {
      console.error('Embedding response:', data)
      throw new Error('Failed to generate embedding')
    }

    return data.embedding.values
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw new Error(`Embedding failed: ${error.message}`)
  }
}
