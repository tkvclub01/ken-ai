-- ============================================
-- SEED DEFAULT ORGANIZATION FOR EXISTING DATA
-- Migration: 017
-- Date: 2026-04-04
-- Description: Creates default organization and assigns all existing data to it
--              This ensures backward compatibility during multi-tenant transition
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE DEFAULT ORGANIZATION
-- ============================================

INSERT INTO public.organizations (
    id, 
    name, 
    slug, 
    description,
    plan, 
    is_active, 
    owner_id,
    settings,
    quota
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Ken-AI Default',
    'ken-ai-default',
    'Default organization for existing Ken-AI data before multi-tenant migration',
    'professional',
    true,
    -- Owner will be updated below after we find the admin user
    (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1),
    '{"max_students": -1, "max_members": -1, "unlimited": true}'::JSONB,
    '{"students": {"used": 0, "limit": -1}, "members": {"used": 0, "limit": -1}}'::JSONB
);

-- ============================================
-- STEP 2: ASSIGN ALL PROFILES TO DEFAULT ORG
-- ============================================

UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE organization_id IS NULL;

-- ============================================
-- STEP 3: ASSIGN ALL BUSINESS DATA TO DEFAULT ORG
-- ============================================

UPDATE public.students 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.documents 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.knowledge_base 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.knowledge_categories 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.conversations 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.conversation_messages 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.email_templates 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.pipeline_stages 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

UPDATE public.audit_logs 
SET organization_id = '00000000-0000-0000-0000-000000000001'::UUID 
WHERE organization_id IS NULL;

-- ============================================
-- STEP 4: CREATE ORGANIZATION MEMBERS RECORDS
-- ============================================

INSERT INTO public.organization_members (
    organization_id, 
    user_id, 
    role, 
    status, 
    joined_at
)
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

-- ============================================
-- STEP 5: UPDATE ORGANIZATION OWNER
-- ============================================

-- Set owner to admin user if exists
UPDATE public.organizations 
SET owner_id = (
    SELECT id FROM public.profiles 
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'::UUID
      AND role = 'admin'
    LIMIT 1
)
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID
  AND owner_id IS NULL;

-- Fallback: If no admin, use first user
UPDATE public.organizations 
SET owner_id = (
    SELECT id FROM public.profiles 
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'::UUID
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID
  AND owner_id IS NULL;

-- ============================================
-- STEP 6: MAKE CRITICAL COLUMNS NOT NULL
-- ============================================

-- After migration, these columns should always have a value
ALTER TABLE public.students 
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.knowledge_base 
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.conversations 
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.email_templates 
    ALTER COLUMN organization_id SET NOT NULL;

-- ============================================
-- VERIFICATION QUERIES (for manual checking)
-- ============================================

-- Check organization was created
DO $$
DECLARE
    org_count INTEGER;
    profile_count INTEGER;
    student_count INTEGER;
    knowledge_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE organization_id = '00000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO student_count FROM students WHERE organization_id = '00000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO knowledge_count FROM knowledge_base WHERE organization_id = '00000000-0000-0000-0000-000000000001';
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '  - Default organization created: %', org_count > 0;
    RAISE NOTICE '  - Profiles assigned: %', profile_count;
    RAISE NOTICE '  - Students assigned: %', student_count;
    RAISE NOTICE '  - Knowledge articles assigned: %', knowledge_count;
    
    IF org_count = 0 THEN
        RAISE EXCEPTION 'Default organization was not created!';
    END IF;
END $$;

COMMIT;
