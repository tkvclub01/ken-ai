import { google } from '@ai-sdk/google'
import { generateText, streamText, generateObject } from 'ai'
import { z } from 'zod'

const gemini = google('gemini-1.5-flash')

/**
 * Extract structured data from document images using OCR
 */
export async function extractDocumentData(
  imageBase64: string,
  documentType: string = 'passport'
) {
  const schema = z.object({
    fullName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    passportNumber: z.string().optional(),
    nationality: z.string().optional(),
    expiryDate: z.string().optional(),
    gpa: z.number().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    confidence: z.number(),
  })

  const prompt = `
    Analyze this ${documentType} document and extract the following information in JSON format.
    If you cannot find a field, leave it as null.
    Also provide an overall confidence score (0-1) for the extraction quality.
    
    Fields to extract:
    - Full Name
    - Date of Birth
    - Passport Number (if applicable)
    - Nationality (if applicable)
    - Expiry Date (if applicable)
    - GPA (if this is an academic transcript)
    - Email
    - Phone Number
    - Address
    
    Return ONLY valid JSON, no additional text.
  `

  try {
    const { object } = await generateObject({
      model: gemini,
      schema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageBase64 },
          ],
        },
      ],
    })

    return object
  } catch (error) {
    console.error('Error extracting document data:', error)
    throw new Error('Failed to extract document data')
  }
}

/**
 * Generate response for AI chat assistant with context from knowledge base
 */
export async function generateAIResponse(
  message: string,
  context?: string,
  studentData?: any
) {
  let systemPrompt = `You are KEN AI, an intelligent assistant helping staff with student consultation and visa processing.
  
You have access to:
- Vietnamese immigration policies
- University admission requirements
- Visa application procedures
- Student records and documents

Always be professional, accurate, and cite your sources when possible.`

  if (context) {
    systemPrompt += `\n\nRelevant Context from Knowledge Base:\n${context}`
  }

  if (studentData) {
    systemPrompt += `\n\nCurrent Student Information:\n${JSON.stringify(studentData, null, 2)}`
  }

  const { text } = await generateText({
    model: gemini,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  })

  return text
}

/**
 * Stream AI response for real-time chat experience
 */
export async function streamAIResponse(
  message: string,
  context?: string,
  studentData?: any
) {
  let systemPrompt = `You are KEN AI, an intelligent assistant helping staff with student consultation and visa processing.`

  if (context) {
    systemPrompt += `\n\nContext:\n${context}`
  }

  if (studentData) {
    systemPrompt += `\n\nStudent Info:\n${JSON.stringify(studentData, null, 2)}`
  }

  const result = streamText({
    model: gemini,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  })

  return result
}

/**
 * Generate real embedding vector using Google's gemini-embedding-001 model
 * Returns 768-dimensional vector optimized for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
    }

    // Truncate to model's max input (2048 tokens ≈ 8000 characters)
    const truncatedText = text.slice(0, 8000)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: truncatedText }]
          },
          taskType: 'RETRIEVAL_DOCUMENT', // Optimized for search retrieval
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Embedding API error:', errorData)
      throw new Error(`Embedding API failed: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    if (!data.embedding?.values) {
      console.error('Invalid embedding response:', data)
      throw new Error('Failed to generate embedding - invalid response format')
    }

    return data.embedding.values // Returns 768-dim vector
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw error
  }
}

/**
 * Draft email based on purpose and student data
 */
export async function draftEmail(
  purpose: string,
  studentData?: any,
  additionalInfo?: string
) {
  let prompt = `Draft a professional email for the following purpose: ${purpose}`

  if (studentData) {
    prompt += `\n\nStudent Information:\n${JSON.stringify(studentData, null, 2)}`
  }

  if (additionalInfo) {
    prompt += `\n\nAdditional Details:\n${additionalInfo}`
  }

  prompt += `\n\nWrite a clear, professional email in English. Include appropriate subject line.`

  const { text } = await generateText({
    model: gemini,
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  return text
}
