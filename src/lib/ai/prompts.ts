/**
 * Pre-built prompt templates for common email drafting scenarios
 */

export const EMAIL_TEMPLATES = {
  universityInquiry: `Draft an email to a university admissions office inquiring about:
- Program requirements for international students
- Application deadlines
- Required documents (transcripts, language certificates, etc.)
- Tuition fees and scholarship opportunities

Tone: Professional and courteous`,

  visaAppeal: `Draft a formal visa rejection appeal letter including:
- Reference to the rejection notice and date
- Grounds for appeal with supporting arguments
- Additional evidence being submitted
- Request for reconsideration

Tone: Respectful but persuasive`,

  welcomeStudent: `Draft a welcome email to a newly enrolled student including:
- Congratulations on acceptance
- Next steps in the enrollment process
- Document checklist they need to prepare
- Contact information for their assigned counselor
- Orientation date and time

Tone: Warm and encouraging`,

  documentReminder: `Draft a reminder email to a student about missing documents:
- List of outstanding documents
- Deadline for submission
- Consequences of late submission
- Offer assistance if they have questions

Tone: Friendly but urgent`,

  schoolSubmission: `Draft a cover email to accompany a student's application package:
- Student's full name and date of birth
- Program applying for
- List of enclosed documents
- Contact information for follow-up

Tone: Professional and concise`,
}

/**
 * System prompts for different AI assistant modes
 */

export const SYSTEM_PROMPTS = {
  generalAssistant: `You are KEN AI, an intelligent assistant specializing in study abroad consultation and visa processing.

Your capabilities:
- Answering questions about immigration policies and university requirements
- Providing guidance on document preparation
- Assisting with application procedures
- Drafting professional communications

Always:
- Be accurate and cite sources when possible
- Maintain a professional yet friendly tone
- Acknowledge uncertainty when you're not sure
- Prioritize student success and compliance`,

  documentAnalyzer: `You are an expert document analyst specializing in educational credentials and legal documents.

Your tasks:
- Extract key information accurately from uploaded documents
- Identify potential issues or inconsistencies
- Verify that documents meet requirements
- Flag suspicious or low-quality scans

Be thorough, detail-oriented, and objective.`,

  policyAdvisor: `You are a knowledgeable advisor on Vietnamese immigration policies and international education regulations.

Your expertise includes:
- Current visa requirements and procedures
- Study permit regulations
- Work rights for international students
- Post-study work opportunities

Always provide up-to-date information and clarify when policies may have changed.`,

  emailCrafter: `You are a professional communication specialist creating emails for educational consultants.

Your writing style:
- Clear, concise, and grammatically correct
- Appropriate formality for the recipient
- Culturally sensitive
- Action-oriented with clear next steps

Always include relevant context and personalize based on available student data.`,
}

/**
 * OCR extraction prompts optimized for different document types
 */

export const OCR_PROMPTS = {
  passport: `Analyze this passport data page and extract the following fields in JSON format:

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
- confidence (0-1 float): Overall confidence in extraction accuracy

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
- courses (array): List of courses with grades if visible
- honors (array): Any academic honors or awards
- confidence (0-1 float): Overall confidence

Return ONLY valid JSON. Convert all dates to YYYY-MM-DD format.`,

  birthCertificate: `Analyze this birth certificate and extract:

Required fields:
- fullName (string): Name at birth / current name
- dateOfBirth (YYYY-MM-DD format)
- placeOfBirth (string): City/Province/Country
- sex (M/F/X)
- fatherName (string): Full name of father
- motherName (string): Full name of maiden name of mother
- certificateNumber (string)
- registrationDate (YYYY-MM-DD format)
- registrationLocation (string)

Also include:
- confidence (0-1 float)

Return ONLY valid JSON.`,

  idCard: `Analyze this national ID card / Citizen Identification Card and extract:

Required fields:
- idNumber (string): ID/Citizen number
- fullName (string)
- dateOfBirth (YYYY-MM-DD format)
- sex (M/F/X)
- nationality (string)
- placeOfOrigin (string): Quê quán
- placeOfResidence (string): Nơi thường trú
- expiryDate (YYYY-MM-DD format or null)
- issueDate (YYYY-MM-DD format)

Also include:
- personalIdentification (string): Dấu vết riêng về hình thức đặc điểm nhận dạng
- confidence (0-1 float)

Return ONLY valid JSON.`,
}

/**
 * Knowledge base query optimization prompts
 */

export const KNOWLEDGE_QUERIES = {
  visaRequirements: `Based on the student's profile and destination country, identify the most relevant visa requirements and procedures.

Consider:
- Student's nationality
- Destination country
- Level of study (undergraduate, postgraduate, etc.)
- Course duration
- Any special circumstances

Provide a structured summary of requirements.`,

  universityMatching: `Based on the student's academic profile and preferences, suggest suitable universities.

Consider:
- GPA and academic performance
- Language proficiency (IELTS/TOEFL scores)
- Preferred field of study
- Budget constraints
- Location preferences
- University rankings

Provide 3-5 recommendations with reasoning.`,

  documentChecklist: `Generate a comprehensive document checklist for this student's application.

Consider:
- Destination country requirements
- University-specific requirements
- Visa application requirements
- Student's individual circumstances (age, gaps in education, etc.)

Organize by category: Academic, Financial, Legal, Medical, etc.`,
}
