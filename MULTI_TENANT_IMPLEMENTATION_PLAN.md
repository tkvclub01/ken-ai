# KEN AI Multi-Tenant Implementation Plan

> **Version:** 1.0  
> **Created:** April 4, 2026  
> **Based on:** [KEN_AI_Multi_Tenant_Architecture_Proposal.md](./KEN_AI_Multi_Tenant_Architecture_Proposal.md)  
> **Status:** Ready for Phase 1 Implementation

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan to convert Ken-AI from single-tenant to multi-tenant architecture. The plan is broken into 5 phases over ~12 weeks, with specific files, database migrations, and testing requirements for each phase.

**Architecture Decision:** Shared-DB + Shared-Schema + Column-Based Isolation via RLS policies.

---

## Table of Contents

1. [Phase 1: Foundation (Weeks 1-3)](#phase-1-foundation-weeks-1-3)
   - Database Schema Setup
   - Migration Scripts
   - RLS Policies
   - Edge Functions Updates
2. [Phase 2: Registration & Invitation (Weeks 4-5)](#phase-2-registration--invitation-weeks-4-5)
3. [Phase 3: Frontend Multi-Tenant (Weeks 6-7)](#phase-3-frontend-multi-tenant-weeks-6-7)
4. [Phase 4: Advanced Features (Weeks 8-10)](#phase-4-advanced-features-weeks-8-10)
5. [Phase 5: Performance & Scale (Weeks 11-12)](#phase-5-performance--scale-weeks-11-12)
6. [Risk Mitigation & Testing Strategy](#risk-mitigation--testing-strategy)
7. [Deployment Checklist](#deployment-checklist)

---

## Phase 1: Foundation (Weeks 1-3)

**Goal:** Establish multi-tenant database schema, RLS policies, and core isolation mechanisms.

**Priority:** P0 (Critical - Must complete before any other features)

### Week 1: Database Schema Creation

#### Task 1.1: Create New Tables Migration

**Files to Create:**
- `supabase/migrations/015_multi_tenant_organizations.sql`

**Content:**

```sql
-- ============================================
-- MULTI-TENANT FOUNDATION - Organizations & Members
-- ============================================

BEGIN;

-- Create enums
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'manager', 'counselor', 'processor', 'member');
CREATE TYPE org_member_status AS ENUM ('pending', 'active', 'suspended', 'left');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    logo_url        TEXT,
    description     TEXT,
    
    -- Contact info
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    website         TEXT,
    
    -- Settings
    settings        JSONB DEFAULT '{}',
    
    -- Subscription
    plan            TEXT DEFAULT 'free',
    quota           JSONB DEFAULT '{}',
    
    -- Metadata
    is_active       BOOLEAN DEFAULT true,
    owner_id        UUID NOT NULL REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members junction table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            org_member_role NOT NULL DEFAULT 'member',
    status          org_member_status NOT NULL DEFAULT 'active',
    invited_by      UUID REFERENCES profiles(id),
    invited_at      TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    permissions     TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by      UUID NOT NULL REFERENCES profiles(id),
    email           TEXT NOT NULL,
    role            org_member_role NOT NULL DEFAULT 'counselor',
    message         TEXT,
    status          invitation_status NOT NULL DEFAULT 'pending',
    token           TEXT UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_by     UUID REFERENCES profiles(id),
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(organization_id, status);
CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);

-- Auto-update triggers
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

**Testing:**
```bash
npx supabase db push
```

---

#### Task 1.2: Add organization_id Columns to Existing Tables

**Files to Create:**
- `supabase/migrations/016_add_organization_columns.sql`

**Content:**

```sql
-- ============================================
-- ADD organization_id TO EXISTING TABLES
-- ============================================

BEGIN;

-- Add columns (nullable initially for migration)
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.documents 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.knowledge_base 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.knowledge_categories 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.conversation_messages 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.email_templates 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.pipeline_stages 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.audit_logs 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_organization ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_org ON knowledge_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_org ON conversation_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_organization ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_organization ON pipeline_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);

COMMIT;
```

---

#### Task 1.3: Create Default Organization & Migrate Existing Data

**Files to Create:**
- `supabase/migrations/017_seed_default_organization.sql`

**Content:**

```sql
-- ============================================
-- SEED DEFAULT ORGANIZATION FOR EXISTING DATA
-- ============================================

BEGIN;

-- Create default organization
INSERT INTO public.organizations (id, name, slug, plan, is_active, owner_id)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Ken-AI Default',
    'ken-ai-default',
    'professional',
    true,
    (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1) -- First user becomes owner
);

-- Assign all existing profiles to default org
UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE organization_id IS NULL;

-- Assign all existing data to default org
UPDATE public.students SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.documents SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.knowledge_base SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.knowledge_categories SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.conversations SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.conversation_messages SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.email_templates SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.pipeline_stages SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;
UPDATE public.audit_logs SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID WHERE organization_id IS NULL;

-- Create organization_members records for all existing users
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    p.id,
    CASE 
        WHEN p.role = 'admin' THEN 'owner'::org_member_role
        WHEN p.role = 'manager' THEN 'manager'::org_member_role
        WHEN p.role = 'counselor' THEN 'counselor'::org_member_role
        WHEN p.role = 'processor' THEN 'processor'::org_member_role
        ELSE 'member'::org_member_role
    END,
    'active'::org_member_status,
    NOW()
FROM public.profiles p
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'::UUID
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Update organization owner_id to admin user
UPDATE public.organizations 
SET owner_id = (
    SELECT id FROM public.profiles 
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'::UUID
      AND role = 'admin'
    LIMIT 1
)
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID
  AND owner_id IS NULL;

-- Make columns NOT NULL after data migration
ALTER TABLE public.students ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.knowledge_base ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.email_templates ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
```

---

#### Task 1.4: Create Database Helper Functions

**Files to Create:**
- `supabase/migrations/018_multi_tenant_functions.sql`

**Content:**

```sql
-- ============================================
-- MULTI-TENANT DATABASE FUNCTIONS
-- ============================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    LIMIT 1;
$$;

-- Require organization (throws error if not member)
CREATE OR REPLACE FUNCTION public.require_current_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User % does not belong to any active organization', auth.uid();
    END IF;
    
    RETURN v_org_id;
END;
$$;

-- Updated permission check with org context
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM pg_auth_members 
        WHERE member = (SELECT usesysid FROM pg_user WHERE usename = current_user)
          AND roleid = (SELECT oid FROM pg_roles WHERE rolname = 'service_role')
    )
    OR EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        JOIN public.organization_members om 
            ON om.role = rp.role::org_member_role
            AND om.status = 'active'
        WHERE om.user_id = p_user_id
          AND rp.permission_id = (
              SELECT id FROM public.permissions WHERE name = p_permission
          )
    );
$$;

-- Seed default data for new tenant
CREATE OR REPLACE FUNCTION public.seed_tenant_data(p_org_id UUID, p_owner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Seed pipeline stages
    INSERT INTO pipeline_stages (name, description, stage_order, color, organization_id)
    VALUES
        ('Tư vấn', 'Giai đoạn tư vấn ban đầu', 1, '#007AFF', p_org_id),
        ('Thu hồ sơ', 'Thu thập tài liệu học sinh', 2, '#FF9500', p_org_id),
        ('Nộp trường', 'Nộp hồ sơ cho trường', 3, '#34C759', p_org_id),
        ('Visa', 'Xin visa du học', 4, '#AF52DE', p_org_id),
        ('Thành công', 'Visa được duyệt', 5, '#30D158', p_org_id),
        ('Từ chối', 'Visa bị từ chối', 6, '#FF3B30', p_org_id);

    -- Seed knowledge categories
    INSERT INTO knowledge_categories (name, description, color, icon, organization_id, created_by)
    VALUES
        ('Chính sách Visa', 'Thông tin về chính sách visa các nước', '#007AFF', 'Plane', p_org_id, p_owner_id),
        ('Học bổng', 'Thông tin học bổng các trường', '#34C759', 'Award', p_org_id, p_owner_id),
        ('Yêu cầu đầu vào', 'Điều kiện tuyển sinh, GPA, IELTS', '#FF9500', 'GraduationCap', p_org_id, p_owner_id),
        ('Chi phí', 'Thông tin học phí, sinh hoạt phí', '#AF52DE', 'DollarSign', p_org_id, p_owner_id),
        ('Quy trình', 'Quy trình xử lý hồ sơ', '#FF3B30', 'ClipboardList', p_org_id, p_owner_id),
        ('Quốc gia', 'Thông tin về các quốc gia du học', '#5AC8FA', 'Globe', p_org_id, p_owner_id),
        ('Trường đại học', 'Thông tin trường đại học đối tác', '#FF6B6B', 'School', p_org_id, p_owner_id),
        ('Tài liệu', 'Hướng dẫn chuẩn bị tài liệu', '#8E8E93', 'FileText', p_org_id, p_owner_id);

    -- Seed email templates
    INSERT INTO email_templates (name, subject_template, body_template, category, organization_id, created_by)
    VALUES
        ('Yêu cầu tài liệu', 'Yêu cầu bổ sung tài liệu - {{student_name}}', 
         'Kính gửi {{student_name}},...', 'documents', p_org_id, p_owner_id),
        ('Cập nhật tiến độ', 'Cập nhật hồ sơ - {{student_name}}', 
         'Chào {{student_name}},...', 'pipeline', p_org_id, p_owner_id);
END;
$$;
```

---

### Week 2: RLS Policy Updates

#### Task 2.1: Update All RLS Policies

**Files to Create:**
- `supabase/migrations/019_update_rls_policies.sql`

**Key Changes:**
- Drop all existing policies
- Recreate with `organization_id = get_current_organization_id()` filter
- Enable RLS on tables that don't have it yet

**Example Pattern:**

```sql
-- Students table
DROP POLICY IF EXISTS students_view_assigned_or_all ON public.students;
CREATE POLICY "students_view_org" ON public.students
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND (
            counselor_id = auth.uid()
            OR user_has_permission(auth.uid(), 'view_all_students')
        )
    );

-- Knowledge base (CRITICAL for AI isolation)
DROP POLICY IF EXISTS knowledge_view ON public.knowledge_base;
CREATE POLICY "knowledge_view_org" ON public.knowledge_base
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'view_knowledge')
    );

-- Conversations (FIX: enforce user ownership)
DROP POLICY IF EXISTS conversations_create ON public.conversations;
CREATE POLICY "conversations_create_org" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        AND user_id = auth.uid()  -- ← CRITICAL FIX
    );
```

---

#### Task 2.2: Update search_knowledge_base Function

**Files to Modify:**
- Add to `supabase/migrations/019_update_rls_policies.sql`

```sql
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    p_category_id UUID DEFAULT NULL,
    p_only_verified boolean DEFAULT false
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    category_id UUID,
    similarity float,
    verified boolean,
    tags TEXT[]
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        kb.category_id,
        1 - (kb.embedding <=> query_embedding) AS similarity,
        kb.verified,
        kb.tags
    FROM public.knowledge_base kb
    WHERE kb.organization_id = get_current_organization_id()  -- ← ADDED
      AND 1 - (kb.embedding <=> query_embedding) > match_threshold
      AND (p_category_id IS NULL OR kb.category_id = p_category_id)
      AND (p_only_verified = false OR kb.verified = true)
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
$$;
```

---

### Week 3: Edge Functions & TypeScript Types

#### Task 3.1: Update Edge Functions

**Files to Modify:**
- `supabase/functions/ingest-knowledge/index.ts`
- `supabase/functions/process-document/index.ts`

**Changes:**
1. Switch from `SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Add `organization_id` validation from JWT
3. Verify user is member of organization

**Example (ingest-knowledge):**

```typescript
// Before
const supabaseClient = createClient(url, serviceRoleKey, { ... })
const { title, content, userId } = await req.json()

// After
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: req.headers.get('Authorization')! } }
})

// Validate authentication
const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}

// Get user's organization
const { data: member } = await supabaseClient
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()

if (!member) {
  return new Response(JSON.stringify({ error: 'Not a member of any organization' }), { status: 403 })
}

const { title, content } = await req.json()

// Insert with organization_id
const { data, error } = await supabaseClient
  .from('knowledge_base')
  .insert({
    title,
    content,
    organization_id: member.organization_id,  // ← ADDED
    embedding,
    created_by: user.id
  })
  .select()
  .single()
```

---

#### Task 3.2: Update TypeScript Types

**Files to Modify:**
- `src/types/index.ts`

**Additions:**

```typescript
// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  settings: Record<string, any>
  plan: string
  quota: Record<string, any>
  is_active: boolean
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'manager' | 'counselor' | 'processor' | 'member'
  status: 'pending' | 'active' | 'suspended' | 'left'
  invited_by: string | null
  invited_at: string | null
  joined_at: string
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface OrganizationInvitation {
  id: string
  organization_id: string
  invited_by: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'counselor' | 'processor' | 'member'
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  token: string
  expires_at: string
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
}

// Update existing types to include organization_id
export type Student = Database['public']['Tables']['students']['Row'] & {
  organization_id?: string
}

export type KnowledgeBase = Database['public']['Tables']['knowledge_base']['Row'] & {
  organization_id?: string
}

// ... similar for all other types
```

---

#### Task 3.3: Create React Query Hooks

**Files to Create:**
- `src/hooks/useOrganizations.ts`

**Content:**

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Organization, OrganizationMember, OrganizationInvitation } from '@/types'
import { handleSupabaseError } from '@/lib/errors'
import { toast } from 'sonner'

/**
 * Fetch current user's organization
 */
export function useCurrentOrganization() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['current-organization'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (!member) return null

        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', member.organization_id)
          .eq('is_active', true)
          .single()

        if (error) throw error
        return org as Organization
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useCurrentOrganization failed:', appError)
        throw appError
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  })
}

/**
 * Fetch organization members
 */
export function useOrganizationMembers(orgId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['organization-members', orgId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as (OrganizationMember & { profiles: any })[]
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useOrganizationMembers failed:', appError)
        throw appError
      }
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Invite member to organization
 */
export function useInviteMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      orgId,
      email,
      role,
      message
    }: {
      orgId: string
      email: string
      role: string
      message?: string
    }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Generate unique token
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

        const { data, error } = await supabase
          .from('organization_invitations')
          .insert({
            organization_id: orgId,
            invited_by: user.id,
            email,
            role,
            message,
            token,
            expires_at: expiresAt,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error
        return data as OrganizationInvitation
      } catch (error: any) {
        const appError = handleSupabaseError(error)
        console.error('useInviteMember failed:', appError)
        throw appError
      }
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully')
      queryClient.invalidateQueries({ queryKey: ['organization-invitations'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitation: ${error.message}`)
    }
  })
}

// Additional hooks: useAcceptInvitation, useRemoveMember, etc.
```

---

### Phase 1 Deliverables

✅ **Database:**
- 3 new tables: `organizations`, `organization_members`, `organization_invitations`
- `organization_id` column added to 10 existing tables
- Default organization seeded with existing data
- 5 database helper functions created

✅ **Security:**
- All RLS policies updated with org isolation
- `search_knowledge_base()` scoped by organization
- `conversations_create` enforces user ownership

✅ **Backend:**
- 2 edge functions updated to use anon key + org validation
- TypeScript types extended with organization interfaces
- 3 React Query hooks created

✅ **Testing:**
- SQL unit tests for RLS policies
- Integration tests for edge functions
- Performance benchmarks on composite indexes

---

## Phase 2: Registration & Invitation (Weeks 4-5)

**Goal:** Allow users to register new organizations and invite team members.

### Week 4: Registration Flow

#### Task 4.1: Update Signup Page

**Files to Modify:**
- `src/app/signup/page.tsx`

**Changes:**
- Add organization name and slug fields to signup form
- Call new API endpoint to create organization

**New API Route:**
- `src/app/api/organizations/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { email, password, full_name, org_name, org_slug } = await request.json()

  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name }
    }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Create organization (in transaction)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: org_name,
      slug: org_slug,
      owner_id: authData.user!.id,
      plan: 'free'
    })
    .select()
    .single()

  if (orgError) {
    // Rollback: delete user
    await supabase.auth.admin.deleteUser(authData.user!.id)
    return NextResponse.json({ error: orgError.message }, { status: 400 })
  }

  // 3. Create organization_members record
  await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: authData.user!.id,
      role: 'owner',
      status: 'active'
    })

  // 4. Update profile
  await supabase
    .from('profiles')
    .update({ organization_id: org.id })
    .eq('id', authData.user!.id)

  // 5. Seed default data
  await supabase.rpc('seed_tenant_data', {
    p_org_id: org.id,
    p_owner_id: authData.user!.id
  })

  return NextResponse.json({ success: true, organization: org })
}
```

---

#### Task 4.2: Update Auth Callback

**Files to Modify:**
- `src/app/auth/callback/route.ts`

**Changes:**
- Redirect to `/dashboard/{org_slug}` instead of `/dashboard`
- Handle pending invitations

---

### Week 5: Invitation System

#### Task 5.1: Create Invitation Pages

**Files to Create:**
- `src/app/invite/[token]/page.tsx`
- `src/app/(dashboard)/[orgSlug]/settings/members/page.tsx`
- `src/app/(dashboard)/[orgSlug]/settings/invitations/page.tsx`

**Components to Create:**
- `src/components/organizations/InviteMemberDialog.tsx`
- `src/components/organizations/MemberList.tsx`
- `src/components/organizations/InvitationList.tsx`

---

#### Task 5.2: Create Invitation API Endpoints

**Files to Create:**
- `src/app/api/organizations/[orgId]/invitations/route.ts`
- `src/app/api/invitations/[token]/accept/route.ts`
- `src/app/api/invitations/[token]/reject/route.ts`

---

### Phase 2 Deliverables

✅ **Registration:**
- Signup page with organization creation
- Auto-seed default data for new tenants
- Auth callback redirects to org dashboard

✅ **Invitations:**
- Invite member dialog with email + role selection
- Accept/reject invitation pages
- Email notifications (via Supabase or Resend)

✅ **Management:**
- Members list page with role management
- Pending invitations list
- Remove member functionality

---

## Phase 3: Frontend Multi-Tenant (Weeks 6-7)

**Goal:** Update frontend to work within organization context.

### Week 6: Context & Routing

#### Task 6.1: Create Organization Provider

**Files to Create:**
- `src/contexts/OrganizationContext.tsx`

**See proposal Section 11.1 for full implementation.**

---

#### Task 6.2: Update Middleware

**Files to Modify:**
- `middleware.ts`

**Changes:**
- Extract org slug from URL: `/dashboard/[orgSlug]/...`
- Verify user is member of organization
- Redirect to correct org slug if mismatch
- Redirect to onboarding if no org

---

#### Task 6.3: Update Layout Structure

**Files to Create:**
- `src/app/(dashboard)/[orgSlug]/layout.tsx`

**Changes:**
- Wrap children with `OrganizationProvider`
- Pass org slug from params

---

### Week 7: UI Components

#### Task 7.1: Update Sidebar

**Files to Modify:**
- `src/components/shared/Sidebar.tsx`

**Changes:**
- Display current organization name/logo
- Add organization switcher dropdown (Phase 4)

---

#### Task 7.2: Update All Queries

**Files to Modify:**
- All hooks in `src/hooks/`
- All components making direct Supabase queries

**Pattern:**
```typescript
// Before
const { data } = await supabase.from('students').select('*')

// After
const { data: org } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', userId)
  .single()

const { data } = await supabase
  .from('students')
  .select('*')
  .eq('organization_id', org.organization_id)
```

---

### Phase 3 Deliverables

✅ **Routing:**
- Dynamic `[orgSlug]` segment in dashboard routes
- Middleware verifies org membership
- Automatic redirects to correct org

✅ **Context:**
- `OrganizationProvider` supplies org context
- All components access org via `useOrganization()`

✅ **UI:**
- Sidebar shows org name/logo
- Members management page
- Invitations management page

---

## Phase 4: Advanced Features (Weeks 8-10)

**Goal:** Production-ready features for scale.

### Week 8: Multi-Org Support

- Organization switcher component
- Per-org knowledge base seeding templates
- Per-org pipeline customization

### Week 9: Quota & Analytics

- Quota tracking system
- Usage analytics per organization
- Organization export/import

### Week 10: Billing

- Subscription plans (Free, Starter, Pro, Enterprise)
- Stripe integration
- Admin portal for managing all organizations

---

## Phase 5: Performance & Scale (Weeks 11-12)

**Goal:** Optimize for production with many tenants.

### Week 11: Database Optimization

- Composite index optimization
- Connection pooling tuning (Supavisor)
- Query performance testing with simulated tenants

### Week 12: Caching & Monitoring

- Redis caching layer for org settings
- Rate limiting per organization
- Monitoring alerts for RLS violations

---

## Risk Mitigation & Testing Strategy

### Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data leakage between tenants | Low | Critical | SQL unit tests for EVERY RLS policy |
| Migration failure causing data loss | Low | Critical | Transaction wrapping + backup + rollback script |
| Performance degradation | Medium | High | Composite indexes + benchmarking |
| Edge function bypasses org isolation | Medium | Critical | Code review + integration tests |

### Testing Checklist

```bash
# 1. RLS Policy Tests (SQL)
psql -f tests/rls_isolation_tests.sql

# 2. Integration Tests
npm test -- tests/integration/multi-tenant.test.ts

# 3. Performance Benchmarks
psql -f tests/performance_benchmarks.sql

# 4. Security Audit
npx supabase db lint
```

---

## Deployment Checklist

### Pre-Production

- [ ] All RLS policies tested with 2+ tenants
- [ ] Data migration successful on staging (no data loss)
- [ ] Rollback script tested on staging
- [ ] All edge functions use anon key (not service_role)
- [ ] `search_knowledge_base()` scoped by organization
- [ ] `conversations_create` enforces `user_id = auth.uid()`
- [ ] Middleware verifies org context on every protected route
- [ ] Frontend queries add `organization_id` filter
- [ ] Performance benchmark: < 200ms for common queries
- [ ] Security audit: no data leakage between tenants
- [ ] Backup strategy for multi-tenant database
- [ ] Monitoring alerts for RLS policy violations
- [ ] Documentation for API changes

### Production Rollout

1. **Backup database** (full snapshot)
2. **Deploy migrations** in order: 015 → 016 → 017 → 018 → 019
3. **Verify data integrity** (row counts match pre/post migration)
4. **Deploy backend** (edge functions, API routes)
5. **Deploy frontend** (with feature flag for gradual rollout)
6. **Monitor logs** for 24 hours
7. **Enable for all users** if no issues

---

## File Inventory Summary

### New Files to Create (Phase 1)

**Database Migrations:**
1. `supabase/migrations/015_multi_tenant_organizations.sql`
2. `supabase/migrations/016_add_organization_columns.sql`
3. `supabase/migrations/017_seed_default_organization.sql`
4. `supabase/migrations/018_multi_tenant_functions.sql`
5. `supabase/migrations/019_update_rls_policies.sql`

**TypeScript Types:**
- Update: `src/types/index.ts` (add Organization, OrganizationMember, OrganizationInvitation)

**React Hooks:**
- `src/hooks/useOrganizations.ts`

**Edge Functions:**
- Update: `supabase/functions/ingest-knowledge/index.ts`
- Update: `supabase/functions/process-document/index.ts`

### Modified Files (Phase 1)

- `src/types/index.ts` - Add organization_id to all types
- `supabase/functions/*/index.ts` - Switch to anon key + org validation

---

## Next Immediate Steps

**Start with Task 1.1:** Create the organizations table migration file.

Would you like me to begin implementing Phase 1 now, starting with the database migrations?
