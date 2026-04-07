-- ============================================
-- ADD organization_id TO EXISTING TABLES
-- Migration: 016
-- Date: 2026-04-04
-- Description: Adds organization_id foreign key to all business tables
--              Columns are nullable initially for data migration
-- ============================================

BEGIN;

-- ============================================
-- ADD COLUMNS (nullable initially)
-- ============================================

-- Profiles: Each user belongs to one organization (can be null during transition)
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Students: Must belong to an organization
ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Documents: Inherit organization from student, but denormalize for performance
ALTER TABLE public.documents 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Knowledge Base: Articles scoped to organization
ALTER TABLE public.knowledge_base 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Knowledge Categories: Categories can be org-specific or system-wide
ALTER TABLE public.knowledge_categories 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Conversations: AI chat conversations scoped to organization
ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Conversation Messages: Inherit from conversation
ALTER TABLE public.conversation_messages 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Email Templates: Templates scoped to organization
ALTER TABLE public.email_templates 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Pipeline Stages: Can be system defaults (NULL) or org-specific
ALTER TABLE public.pipeline_stages 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Audit Logs: Logs scoped to organization
ALTER TABLE public.audit_logs 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- Critical for RLS policy performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_students_organization ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_org_counselor ON students(organization_id, counselor_id);
CREATE INDEX IF NOT EXISTS idx_students_org_status ON students(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_student ON documents(organization_id, student_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_org_category ON knowledge_base(organization_id, category_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_org ON knowledge_categories(organization_id);

CREATE INDEX IF NOT EXISTS idx_conversations_organization ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_user ON conversations(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_org ON conversation_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_organization ON email_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_organization ON pipeline_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(organization_id, stage_order);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action ON audit_logs(organization_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_performed ON audit_logs(organization_id, performed_at DESC);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.organization_id IS 'Organization this user belongs to (nullable during migration)';
COMMENT ON COLUMN students.organization_id IS 'Organization that owns this student record';
COMMENT ON COLUMN documents.organization_id IS 'Organization that owns this document (denormalized from student)';
COMMENT ON COLUMN knowledge_base.organization_id IS 'Organization that owns this knowledge article';
COMMENT ON COLUMN knowledge_categories.organization_id IS 'Organization that owns this category (NULL = system default)';
COMMENT ON COLUMN conversations.organization_id IS 'Organization that owns this conversation';
COMMENT ON COLUMN conversation_messages.organization_id IS 'Organization that owns this message (denormalized from conversation)';
COMMENT ON COLUMN email_templates.organization_id IS 'Organization that owns this template';
COMMENT ON COLUMN pipeline_stages.organization_id IS 'Organization that owns this stage (NULL = system default for all)';
COMMENT ON COLUMN audit_logs.organization_id IS 'Organization where this action occurred';

COMMIT;
