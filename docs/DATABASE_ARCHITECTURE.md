# KEN AI - DATABASE ARCHITECTURE

## Overview

KEN AI uses Supabase (PostgreSQL) as its database with advanced features including vector embeddings, Row Level Security (RLS), triggers, and stored procedures for a comprehensive student management and AI-powered platform.

---

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE ERD                          │
│                                                              │
│  ┌──────────┐         ┌──────────┐          ┌────────────┐  │
│  │ profiles │◄────────│ students │◄─────────│ documents  │  │
│  │ (users)  │         │          │          │ (OCR)      │  │
│  └──────────┘         └──────────┘          └────────────  │
│       │                   │                                  │
│       │              ┌────┴──────┐                           │
│       │              │student_   │                           │
│       │              │pipeline   │                           │
│       │              └────┬──────┘                           │
│       │                   │                                  │
│       │              ┌────┴──────┐                           │
│       │              │pipeline_  │                           │
│       │              │stages     │                           │
│       │              └───────────┘                           │
│       │                                                      │
│  ┌────┴──────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │conver-    │    │knowledge_    │    │audit_logs        │  │
│  │sations    │    │base (vector) │    │                  │  │
│  └───────────┘    └──────────────┘    └──────────────────┘  │
│                                                              │
│  ┌──────────┐    ┌──────────────┐                           │
│  │role_     │    │permissions   │                           │
│  │permissions│   │              │                           │
│  └──────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### 1. profiles
User profiles with role-based access control.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'counselor',
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  location TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_profiles_email` - Email lookup
- `idx_profiles_role` - Role filtering

**Key Fields:**
- `role`: ENUM (admin, manager, counselor, processor, student)
- `is_active`: Account activation status
- `last_login_at`: Last login timestamp

---

### 2. students
Student records and application information.

```sql
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
```

**Indexes:**
- `idx_students_counselor` - Filter by counselor
- `idx_students_status` - Status filtering
- `idx_students_passport` - Passport lookup

**Key Fields:**
- `counselor_id`: Assigned counselor
- `status`: lead, active, inactive, completed
- `gpa`: Student GPA (3.2 scale)

---

### 3. documents
Document storage with OCR extraction results.

```sql
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
```

**Indexes:**
- `idx_documents_student` - Filter by student
- `idx_documents_ocr_status` - OCR status filtering
- `idx_documents_category` - Category filtering

**Key Fields:**
- `ocr_status`: pending, processing, completed, verified, rejected
- `extracted_data`: JSONB with OCR results
- `verified_by`: User who verified the document

---

### 4. pipeline_stages
Student application pipeline stages.

```sql
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  stage_order INTEGER NOT NULL UNIQUE,
  color TEXT DEFAULT '#007AFF',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Stages:**
1. Consultation (#FF9500)
2. Document Collection (#5856D6)
3. School Submission (#007AFF)
4. Visa Application (#34C759)
5. Approved (#30D158)
6. Rejected (#FF3B30)

---

### 5. student_pipeline
Tracks student progression through pipeline stages.

```sql
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
```

---

### 6. knowledge_base
AI knowledge base with vector embeddings for semantic search.

```sql
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
```

**Indexes:**
- `idx_knowledge_base_embedding` - IVFFLAT vector index
- `idx_knowledge_base_category` - Category filtering
- `idx_knowledge_base_tags` - GIN index for array search

**Key Features:**
- **Vector Embeddings**: 1536-dimensional for semantic search
- **IVFFLAT Index**: Fast similarity search
- **Tags Array**: GIN index for tag-based filtering

---

### 7. audit_logs
Complete audit trail of all data changes.

```sql
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
```

**Indexes:**
- `idx_audit_logs_table` - Filter by table
- `idx_audit_logs_record` - Filter by record
- `idx_audit_logs_performed_at` - Timestamp filtering
- `idx_audit_logs_performed_by` - User filtering
- `idx_audit_logs_action` - Action filtering
- `idx_audit_logs_table_name` - Table name filtering
- `idx_audit_logs_record_id` - Record ID filtering
- `idx_audit_logs_performed_at` - Timestamp (descending)

**Key Fields:**
- `table_name`: Table that was modified
- `record_id`: UUID of the modified record
- `action`: INSERT, UPDATE, DELETE
- `changes`: JSONB diff of changes
- `performed_by`: User who made the change

---

### 8. conversations
AI chat conversations.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES students(id),
  title TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_conversations_user` - Filter by user
- `idx_conversations_student` - Filter by student

---

### 9. conversation_messages
Messages within conversations.

```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_conversation_messages_conversation` - Filter by conversation

**Key Fields:**
- `role`: user, assistant, system
- `metadata`: JSONB with additional data (tokens, citations)

---

### 10. email_templates
Reusable email templates.

```sql
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
```

---

## RBAC Tables

### 11. permissions
System permissions catalog.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_permissions_category` - Category filtering
- `idx_permissions_name` - Name lookup

**Permission Categories:**
- `students`: view_students, create_students, edit_students, delete_students, view_all_students
- `documents`: view_documents, upload_documents, verify_documents, delete_documents
- `knowledge`: view_knowledge, create_knowledge, edit_knowledge, delete_knowledge, access_ai_settings
- `pipeline`: view_pipeline, move_pipeline, edit_pipeline
- `analytics`: view_analytics, view_financials
- `users`: view_users, invite_users, edit_users, delete_users
- `settings`: access_settings, manage_settings

---

### 12. role_permissions
Maps permissions to roles.

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);
```

**Indexes:**
- `idx_role_permissions_role` - Role lookup
- `idx_role_permissions_permission` - Permission lookup

---

## Enums

### user_role
```sql
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'counselor', 'processor');
```

### document_status
```sql
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'verified', 'rejected');
```

### pipeline_status
```sql
CREATE TYPE pipeline_status AS ENUM ('consultation', 'document_collection', 'school_submission', 'visa', 'approved', 'rejected');
```

---

## Database Functions

### 1. Authentication & User Management

#### handle_new_user()
Automatically creates profile when user signs up.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'counselor'),
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### 2. Audit Logging

#### log_audit_changes()
Automatically logs all changes to critical tables.

```sql
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
```

**Applied to:**
- profiles
- students
- documents

---

### 3. Timestamp Updates

#### update_updated_at_column()
Auto-updates `updated_at` timestamp on record changes.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to:**
- profiles
- students
- knowledge_base
- email_templates
- conversations

---

### 4. RBAC Functions

#### user_has_permission(user_id, permission_name)
Checks if a user has a specific permission.

```sql
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  has_perm BOOLEAN;
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = user_id;
  
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role_val AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_user_permissions(user_id)
Returns all permissions for a user.

```sql
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT p.name
    FROM profiles pr
    JOIN role_permissions rp ON pr.role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE pr.id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_user_auth_data(user_id)
Returns user's role and permissions as JSON.

```sql
CREATE OR REPLACE FUNCTION get_user_auth_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role_val user_role;
  perms TEXT[];
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = user_id;
  perms := get_user_permissions(user_id);
  
  RETURN jsonb_build_object(
    'role', user_role_val,
    'permissions', perms
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_current_user_permissions()
Gets current authenticated user's permissions.

```sql
CREATE OR REPLACE FUNCTION get_current_user_permissions()
RETURNS JSONB AS $$
BEGIN
  RETURN get_user_auth_data(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### current_user_has_permission(permission_name)
Checks if current user has a permission.

```sql
CREATE OR REPLACE FUNCTION current_user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_permission(auth.uid(), permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 5. Vector Search Functions

#### match_documents()
Basic vector similarity search.

```sql
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
LANGUAGE plpgsql AS $$
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
```

#### search_knowledge_base()
Enhanced vector search with filtering and ranking.

```sql
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
LANGUAGE plpgsql AS $$
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
```

#### increment_knowledge_view(doc_id)
Increments view count for a document.

```sql
CREATE OR REPLACE FUNCTION increment_knowledge_view(doc_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE knowledge_base
  SET view_count = view_count + 1
  WHERE id = doc_id;
END;
$$;
```

#### increment_knowledge_helpful(doc_id)
Increments helpful count for a document.

```sql
CREATE OR REPLACE FUNCTION increment_knowledge_helpful(doc_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE knowledge_base
  SET helpful_count = helpful_count + 1
  WHERE id = doc_id;
END;
$$;
```

#### get_knowledge_base_stats()
Returns knowledge base statistics.

```sql
CREATE OR REPLACE FUNCTION get_knowledge_base_stats()
RETURNS JSONB LANGUAGE plpgsql AS $$
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
```

---

## Row Level Security (RLS) Policies

### Students Table
```sql
-- View: Assigned students or all students (if permission)
CREATE POLICY "students_view_assigned_or_all" ON students
FOR SELECT USING (
  counselor_id = auth.uid() 
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Create: Requires create_students permission
CREATE POLICY "students_create" ON students
FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'create_students')
);

-- Update: Counselor can edit assigned students
CREATE POLICY "students_update" ON students
FOR UPDATE USING (
  (counselor_id = auth.uid() AND user_has_permission(auth.uid(), 'edit_students'))
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Delete: Requires delete_students permission
CREATE POLICY "students_delete" ON students
FOR DELETE USING (
  user_has_permission(auth.uid(), 'delete_students')
);
```

### Documents Table
```sql
-- View: Documents for assigned students
CREATE POLICY "documents_view" ON documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = student_id 
    AND (s.counselor_id = auth.uid() OR user_has_permission(auth.uid(), 'view_all_students'))
  )
  AND user_has_permission(auth.uid(), 'view_documents')
);

-- Upload: Requires upload_documents permission
CREATE POLICY "documents_upload" ON documents
FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'upload_documents')
);

-- Verify: Requires verify_documents permission
CREATE POLICY "documents_verify" ON documents
FOR UPDATE USING (
  user_has_permission(auth.uid(), 'verify_documents')
);
```

### Knowledge Base Table
```sql
-- View: All authenticated users with permission
CREATE POLICY "knowledge_view" ON knowledge_base
FOR SELECT USING (
  user_has_permission(auth.uid(), 'view_knowledge')
);

-- Create/Edit/Delete: Based on permissions
CREATE POLICY "knowledge_create" ON knowledge_base
FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'create_knowledge')
);

CREATE POLICY "knowledge_edit" ON knowledge_base
FOR UPDATE USING (
  user_has_permission(auth.uid(), 'edit_knowledge')
);

CREATE POLICY "knowledge_delete" ON knowledge_base
FOR DELETE USING (
  user_has_permission(auth.uid(), 'delete_knowledge')
);
```

### Audit Logs Table
```sql
-- View: Only admin and manager
CREATE POLICY "audit_logs_view" ON audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
  )
);

-- Insert: Admin and manager can insert
CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
  )
);
```

### Conversations Table
```sql
-- View: Own conversations or all (if admin)
CREATE POLICY "conversations_view" ON conversations
FOR SELECT USING (
  user_id = auth.uid()
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Create: All authenticated users
CREATE POLICY "conversations_create" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
```

---

## Database Extensions

### Required Extensions
```sql
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## Database Views

### v_permissions_by_role
Complete permission matrix by role.

```sql
CREATE VIEW v_permissions_by_role AS
SELECT 
  rp.role,
  p.name AS permission_name,
  p.description,
  p.category
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.category, p.name;
```

### v_user_profiles
User details with auth info.

```sql
CREATE VIEW v_user_profiles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.email_verified,
  p.last_login_at,
  p.created_at,
  au.email_confirmed_at as auth_email_confirmed,
  au.created_at as auth_created
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;
```

---

## Migration Strategy

### Migration Order
1. `000_extensions.sql` - PostgreSQL extensions
2. `002_main_migration.sql` - Core schema and seed data
3. `003_rbac_migration.sql` - RBAC system
4. `004_rls_policies.sql` - Row Level Security
5. `005_fix_profiles_signup.sql` - Signup fixes
6. `006_audit_logging.sql` - Audit logging enhancements

### Running Migrations
```bash
# Apply all migrations
supabase db push

# Reset database (development only)
supabase db reset
```

---

## Performance Optimization

### Indexes Summary
- **B-Tree Indexes**: Email, role, status lookups
- **GIN Indexes**: Array search (tags)
- **IVFFLAT Indexes**: Vector similarity search
- **Composite Indexes**: Multi-column filtering

### Query Optimization
- Use RLS policies for row filtering
- Leverage stored procedures for complex queries
- Cache frequently accessed data in application layer
- Use database views for common joins

### Vector Search Optimization
```sql
-- IVFFLAT configuration (tune based on dataset size)
ALTER TABLE knowledge_base 
ALTER COLUMN embedding SET STORAGE EXTERNAL;

-- Set lists parameter for IVFFLAT
SET ivfflat.probes = 10;
```

---

*Last Updated: April 2025*
