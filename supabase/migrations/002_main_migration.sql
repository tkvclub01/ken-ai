-- ============================================
-- KEN AI - MAIN DATABASE MIGRATION
-- Run this AFTER 000_extensions.sql completes
-- ============================================

-- Verify extensions are loaded
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');

-- STEP 1: Create Enum Types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'counselor', 'processor');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'verified', 'rejected');
CREATE TYPE pipeline_status AS ENUM ('consultation', 'document_collection', 'school_submission', 'visa', 'approved', 'rejected');

-- STEP 2: Create All Tables

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'counselor',
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  passport_number TEXT,
  counselor_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  gpa NUMERIC(3, 2),
  email TEXT,
  phone TEXT,
  address TEXT,
  nationality TEXT,
  intended_country TEXT,
  intended_major TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline Stages Table
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  stage_order INTEGER NOT NULL UNIQUE,
  color TEXT DEFAULT '#007AFF',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Pipeline Table
CREATE TABLE student_pipeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  current_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
  previous_stage_id UUID REFERENCES pipeline_stages(id),
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  moved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  upload_status TEXT DEFAULT 'uploaded',
  ocr_status document_status DEFAULT 'pending',
  extracted_data JSONB,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  document_category TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base Table (with vector)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  category TEXT,
  tags TEXT[],
  source_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changes JSONB NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  performed_by_email TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES students(id),
  title TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Messages Table
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category TEXT,
  variables TEXT[],
  created_by UUID REFERENCES profiles(id),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create Indexes

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_counselor ON students(counselor_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_passport ON students(passport_number);
CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_documents_ocr_status ON documents(ocr_status);
CREATE INDEX idx_documents_category ON documents(document_category);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN (tags);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_student ON conversations(student_id);
CREATE INDEX idx_conversation_messages_conversation ON conversation_messages(conversation_id);

-- STEP 4: Insert Default Pipeline Stages

INSERT INTO pipeline_stages (name, description, stage_order, color) VALUES
('Consultation', 'Initial consultation and needs assessment', 1, '#FF9500'),
('Document Collection', 'Collecting required documents from student', 2, '#5856D6'),
('School Submission', 'Submitting application to universities', 3, '#007AFF'),
('Visa Application', 'Preparing and submitting visa application', 4, '#34C759'),
('Approved', 'Visa approved, preparing for departure', 5, '#30D158'),
('Rejected', 'Application rejected', 6, '#FF3B30');

-- STEP 5: Create Functions & Triggers

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'counselor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Audit logging function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB;
  old_data JSONB;
  new_data JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    changed_fields := new_data;
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', NULL, new_data, changed_fields, current_setting('app.current_user_email', true));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    changed_fields := new_data - old_data;
    IF changed_fields IS NOT NULL AND changed_fields != '{}'::jsonb THEN
      INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_data, new_data, changed_fields, current_setting('app.current_user_email', true));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changes, performed_by_email)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', old_data, NULL, old_data, current_setting('app.current_user_email', true));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_profiles_changes AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_students_changes AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_documents_changes AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Vector search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > 0.5
    AND (filter->>'category' IS NULL OR kb.category = filter->>'category')
    AND (filter->>'verified' IS NULL OR kb.verified = (filter->>'verified')::boolean)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enhanced search function
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  similarity FLOAT,
  verified BOOLEAN,
  view_count INTEGER,
  helpful_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) AS similarity,
    kb.verified,
    kb.view_count,
    kb.helpful_count
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > min_similarity
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND (filter_tags IS NULL OR kb.tags && filter_tags)
  ORDER BY 
    kb.embedding <=> query_embedding,
    kb.verified DESC,
    kb.helpful_count DESC
  LIMIT match_count;
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION increment_knowledge_view(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_base
  SET view_count = view_count + 1
  WHERE id = doc_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_knowledge_helpful(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_base
  SET helpful_count = helpful_count + 1
  WHERE id = doc_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_knowledge_base_stats()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_documents', COUNT(*),
    'verified_documents', COUNT(*) FILTER (WHERE verified = true),
    'pending_verification', COUNT(*) FILTER (WHERE verified = false),
    'total_views', COALESCE(SUM(view_count), 0),
    'total_helpful', COALESCE(SUM(helpful_count), 0),
    'categories', jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL)
  ) INTO stats
  FROM knowledge_base;
  
  RETURN stats;
END;
$$;

-- STEP 6: Seed Sample Knowledge Base Data

INSERT INTO knowledge_base (title, content, category, tags, verified) VALUES
('Visa Requirements for Australia', 
 'Students applying for Australian student visa (subclass 500) need:
  1. Confirmation of Enrollment (CoE) from registered institution
  2. Genuine Temporary Entrant (GTE) statement
  3. English proficiency test (IELTS/TOEFL/PTE)
  4. Financial capacity evidence
  5. Overseas Student Health Cover (OSHC)
  6. Character and health requirements
  
Processing time: 4-8 weeks
Visa fee: AUD 650', 
 'Australia', 
 ARRAY['visa', 'australia', 'requirements', 'subclass-500'],
 true),

('UK Student Visa Guide',
 'Tier 4 (General) student visa requirements:
  1. CAS (Confirmation of Acceptance for Studies)
  2. Financial maintenance: £1,334/month (London) or £1,023/month (outside London)
  3. English language requirement: CEFR Level B2
  4. TB test certificate (if applicable)
  5. Academic qualifications
  6. ATAS certificate (for sensitive subjects)
  
Processing time: 3 weeks
Visa fee: £490
Healthcare surcharge: £470/year',
 'United Kingdom',
 ARRAY['visa', 'uk', 'tier-4', 'cas'],
 true),

('USA F-1 Visa Process',
 'F-1 student visa steps:
  1. Get accepted by SEVP-certified school
  2. Receive Form I-20 from school
  3. Pay SEVIS fee ($350)
  4. Complete DS-160 form
  5. Schedule visa interview
  6. Prepare financial documents
  7. Attend visa interview
  
Required documents:
- Passport valid 6 months beyond stay
- Form I-20
- DS-160 confirmation
- Visa application photo
- Financial evidence
- Academic transcripts

Processing time: Varies by embassy
MRV fee: $185',
 'United States',
 ARRAY['visa', 'usa', 'f-1', 'sevis'],
 true),

('Canada Study Permit Requirements',
 'Canadian study permit requirements:
  1. Letter of acceptance from DLI (Designated Learning Institution)
  2. Proof of identity (passport)
  3. Proof of financial support:
     - Tuition fees
     - Living expenses: CAD 20,635/year (outside Quebec)
     - Return transportation
  4. Letter of explanation
  5. Medical exam (if required)
  6. Police certificate
  
Biometrics required: CAD 85
Processing time: 8-13 weeks',
 'Canada',
 ARRAY['visa', 'canada', 'study-permit', 'dli'],
 true),

('Scholarship Opportunities - Australia Awards',
 'Australia Awards Scholarships:
  - Full tuition coverage
  - Travel allowance
  - Establishment allowance
  - Contribution to living expenses
  - OSHC health cover
  
Eligibility:
- Citizens of eligible developing countries
- Bachelor degree holders or work experience
- Meet English requirements (IELTS 6.5+)
- Commit to return home after studies

Application period: February-April annually
Highly competitive - apply early!',
 'Scholarships',
 ARRAY['scholarship', 'australia', 'awards', 'funding'],
 true),

('GPA Requirements for Top Universities',
 'Minimum GPA requirements by country:
 
🇺🇸 USA (Top 50):
- Undergraduate: 3.5/4.0
- Graduate: 3.7/4.0

🇬🇧 UK (Russell Group):
- Upper second-class honours (2:1)
- Equivalent to 3.3-3.7/4.0

🇦🇺 Australia (Group of Eight):
- 65-75% (Credit to Distinction)
- 3.0-3.5/4.0 equivalent

🇨🇦 Canada (U15):
- B+ average (3.3/4.0)
- Some programs require A- (3.7)

Tips to improve GPA:
- Retake low-grade courses
- Take summer courses
- Focus on major courses
- Get academic support',
 'Academic Requirements',
 ARRAY['gpa', 'requirements', 'universities', 'grades'],
 true),

('English Proficiency Tests Comparison',
 'Test comparison for study abroad:

IELTS Academic:
- Score range: 0-9 bands
- Validity: 2 years
- Cost: ~$200-250
- Accepted: UK, Australia, Canada, USA, NZ

TOEFL iBT:
- Score range: 0-120
- Validity: 2 years
- Cost: ~$180-300
- Accepted: USA, Canada, Australia, UK

PTE Academic:
- Score range: 10-90
- Validity: 2 years
- Cost: ~$200-350
- Faster results (2 days)
- Computer-based only

Duolingo English Test:
- Score range: 10-160
- Validity: 2 years
- Cost: ~$59
- Online from home
- Growing acceptance

Typical requirements:
- IELTS: 6.5 overall (no band <6.0)
- TOEFL: 79-100+
- PTE: 58-65+',
 'English Tests',
 ARRAY['ielts', 'toefl', 'pte', 'english', 'proficiency'],
 true),

('Document Checklist for University Application',
 'Essential documents for university applications:

✅ Academic Documents:
- High school transcripts (notarized)
- University transcripts (if applicable)
- Diploma/certificate of graduation
- Class ranking certificate

✅ Standardized Tests:
- IELTS/TOEFL score report
- SAT/ACT scores (for US undergrad)
- GRE/GMAT scores (for graduate programs)

✅ Personal Documents:
- Passport copy (valid 6+ months)
- Birth certificate
- ID card

✅ Application Materials:
- Statement of Purpose (SOP)
- Letters of Recommendation (2-3)
- Resume/CV
- Portfolio (for art/design programs)

✅ Financial Documents:
- Bank statements (6+ months)
- Sponsor letter
- Income proof

All documents must be:
- Notarized translations (if not in English)
- Certified true copies
- Recent (issued within 6 months)',
 'Application Process',
 ARRAY['documents', 'checklist', 'application', 'requirements'],
 true),

('Visa Rejection Appeals Process',
 'How to appeal visa rejection:

1. Understand the reason:
   - Review refusal letter carefully
   - Common reasons: insufficient funds, GTE concerns, incomplete docs

2. Gather additional evidence:
   - Address specific concerns raised
   - Provide stronger financial proof
   - Write detailed explanation letter

3. Options:
   a) Administrative Review (UK) - 28 days
   b) Reapply with stronger application
   c) Appeal to tribunal (if right exists)

4. Strengthen new application:
   - Update all documents
   - Add missing evidence
   - Improve SOP/GTE statement
   - Show stronger ties to home country

5. Timeline:
   - Act quickly but thoroughly
   - Don''t rush reapplication
   - Quality over speed

Success rate: 60-70% with proper preparation',
 'Visa Appeals',
 ARRAY['visa', 'rejection', 'appeal', 'refusal'],
 true),

('Pre-departure Checklist for Students',
 'Before leaving for study abroad:

📋 Final Documents:
- Passport with visa
- Original academic certificates
- Flight tickets
- Travel insurance
- Accommodation confirmation
- University enrollment letter

💰 Financial Preparation:
- Open bank account in destination
- Carry some local currency
- Notify your bank about travel
- Get international credit/debit card

🏥 Health & Safety:
- Complete medical checkups
- Get required vaccinations
- Pack prescription medications
- Register with embassy

📱 Connectivity:
- Unlock phone for international use
- Research SIM card options
- Install essential apps
- Share contact details with family

🧳 Packing:
- Check baggage allowance
- Pack for climate
- Bring adapters/converters
- Essential items in carry-on

✈️ Airport:
- Arrive 3 hours early
- Have documents accessible
- Declare cash if required
- Keep I-20/CAS handy for immigration',
 'Pre-departure',
 ARRAY['checklist', 'preparation', 'departure', 'travel'],
 true);

-- STEP 7: Add Comments

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE students IS 'Student records and application information';
COMMENT ON TABLE documents IS 'Document storage with OCR extraction results';
COMMENT ON TABLE knowledge_base IS 'Vector embeddings for semantic search and AI memory';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of all data changes';
COMMENT ON FUNCTION search_knowledge_base IS 'Semantic search with vector similarity and filtering';

-- ============================================
-- DEPLOYMENT COMPLETE! ✅
-- ============================================
