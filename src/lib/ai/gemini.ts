import { google } from '@ai-sdk/google'
import { generateText, streamText, generateObject } from 'ai'
import { z } from 'zod'

// Use gemini-2.5-flash-lite for chat bot support (fast and cost-effective)
const gemini = google('gemini-2.5-flash-lite')

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20 // 20 calls per minute

// In-memory rate limit store (keyed by user ID or IP)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// NEW: Response cache for frequent queries (TTL: 1 hour)
interface CacheEntry {
  response: string
  timestamp: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const responseCache = new Map<string, CacheEntry>()

/**
 * Generate cache key from message and context
 */
function generateCacheKey(message: string, context?: string): string {
  const normalizedMessage = message.toLowerCase().trim()
  const normalizedContext = context ? context.toLowerCase().trim() : ''
  return `${normalizedMessage}|${normalizedContext}`
}

/**
 * Check if cached response exists and is still valid
 */
function getCachedResponse(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL_MS) {
    // Cache expired
    responseCache.delete(key)
    return null
  }
  
  console.log(`[Cache HIT] Returning cached response for query`)
  return entry.response
}

/**
 * Store response in cache
 */
function setCachedResponse(key: string, response: string): void {
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
  })
  console.log(`[Cache SET] Cached response for future queries`)
}

// Cleanup interval for expired rate limit entries (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

/**
 * Periodically clean up expired rate limit entries to prevent memory leaks
 */
function startRateLimitCleanup(): void {
  setInterval(() => {
    const now = Date.now()
    let cleanedCount = 0
    
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
        cleanedCount++
      }
    })
    
    // NEW: Also clean up expired cache entries
    responseCache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        responseCache.delete(key)
        cleanedCount++
      }
    })
    
    if (cleanedCount > 0) {
      console.log(`[Cleanup] Cleaned up ${cleanedCount} expired entries (rate limits + cache)`)
    }
  }, CLEANUP_INTERVAL_MS)
}

// Start cleanup on module load
if (typeof window === 'undefined') {
  // Only run on server-side
  startRateLimitCleanup()
}

/**
 * Check and enforce rate limit for a given key (user ID or IP)
 * @param key - Identifier for rate limiting (userId, IP, etc.)
 * @throws Error if rate limit exceeded
 */
function checkRateLimit(key: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired - reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    })
    return
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const remainingMs = entry.resetTime - now
    const remainingSec = Math.ceil(remainingMs / 1000)
    throw new Error(
      `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute. Try again in ${remainingSec}s`
    )
  }

  // Increment counter
  entry.count += 1
}

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
 * @param message - User's message
 * @param context - Optional context from knowledge base
 * @param studentData - Optional student data
 * @param userId - User ID for rate limiting (defaults to 'anonymous')
 */
export async function generateAIResponse(
  message: string,
  context?: string,
  studentData?: any,
  userId: string = 'anonymous'
) {
  // Enforce rate limit
  checkRateLimit(userId)

  // NEW: Check cache first
  const cacheKey = generateCacheKey(message, context)
  const cachedResponse = getCachedResponse(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

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

  try {
    const { text } = await generateText({
      model: gemini,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    // NEW: Cache the response
    setCachedResponse(cacheKey, text)

    return text
  } catch (error: any) {
    console.error('Error generating AI response:', error)
    
    // Check if it's a rate limit error
    if (error.message?.includes('Rate limit exceeded')) {
      throw error // Re-throw rate limit errors as-is
    }
    
    // Wrap other errors with user-friendly message
    throw new Error(`AI service unavailable: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Stream AI response for real-time chat experience
 */
export async function streamAIResponse(
  message: string,
  context?: string,
  studentData?: any,
  userId: string = 'anonymous'
) {
  // Enforce rate limit
  checkRateLimit(userId)

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
export async function generateEmbedding(text: string, userId: string = 'anonymous'): Promise<number[]> {
  // Enforce rate limit (embeddings can be expensive)
  checkRateLimit(userId)

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
 * Classify document type using AI analysis
 */
export async function classifyDocument(
  extractedData: any,
  fileName: string,
  mimeType: string
): Promise<{ documentType: string; confidence: number }> {
  const prompt = `
    Analyze this document and classify it into one of the following types:
    - passport
    - academic_transcript
    - visa_application
    - recommendation_letter
    - personal_essay
    - english_certificate
    - financial_document
    - birth_certificate
    - other
    
    Document filename: ${fileName}
    File type: ${mimeType}
    Extracted data: ${JSON.stringify(extractedData, null, 2)}
    
    Return ONLY a JSON object with:
    - documentType: the classified type (use snake_case)
    - confidence: number between 0-1 indicating confidence level
  `

  try {
    const schema = z.object({
      documentType: z.string(),
      confidence: z.number().min(0).max(1),
    })

    const { object } = await generateObject({
      model: gemini,
      schema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    return {
      documentType: object.documentType,
      confidence: object.confidence,
    }
  } catch (error) {
    console.error('Error classifying document:', error)
    return {
      documentType: 'other',
      confidence: 0,
    }
  }
}

/**
 * Aggregate student profile from multiple document extractions
 */
export async function aggregateStudentProfile(
  documents: Array<{ fileName: string; documentType: string; data: any }>,
  currentStudentId: string
): Promise<Partial<any>> {
  const aggregatedData: any = {}

  // Extract and merge data from different document types
  for (const doc of documents) {
    const { documentType, data } = doc

    switch (documentType) {
      case 'passport':
        if (data.fullName && !aggregatedData.full_name) {
          aggregatedData.full_name = data.fullName
        }
        if (data.dateOfBirth && !aggregatedData.date_of_birth) {
          aggregatedData.date_of_birth = data.dateOfBirth
        }
        if (data.nationality && !aggregatedData.nationality) {
          aggregatedData.nationality = data.nationality
        }
        if (data.passportNumber) {
          aggregatedData.passport_number = data.passportNumber
        }
        break

      case 'academic_transcript':
        if (data.gpa) {
          aggregatedData.gpa = data.gpa
        }
        if (data.email && !aggregatedData.email) {
          aggregatedData.email = data.email
        }
        break

      case 'english_certificate':
        if (data.ieltsScore || data.toeflScore) {
          aggregatedData.english_test_score = data.ieltsScore || data.toeflScore
          aggregatedData.english_test_type = data.ieltsScore ? 'IELTS' : 'TOEFL'
        }
        break

      case 'visa_application':
        if (data.targetCountry && !aggregatedData.target_country) {
          aggregatedData.target_country = data.targetCountry
        }
        break

      case 'other':
        // Store miscellaneous data in metadata
        if (!aggregatedData.metadata) {
          aggregatedData.metadata = {}
        }
        aggregatedData.metadata[documentType] = data
        break
    }
  }

  // Remove undefined values
  Object.keys(aggregatedData).forEach(key => {
    if (aggregatedData[key] === undefined) {
      delete aggregatedData[key]
    }
  })

  return aggregatedData
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
