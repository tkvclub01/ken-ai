-- ============================================
-- MULTI-TENANT FOUNDATION - Organizations & Members
-- Migration: 015
-- Date: 2026-04-04
-- Description: Creates core multi-tenant tables
-- ============================================

BEGIN;

-- Create enums for organization management
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'manager', 'counselor', 'processor', 'member');
CREATE TYPE org_member_status AS ENUM ('pending', 'active', 'suspended', 'left');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');

-- ============================================
-- ORGANIZATIONS TABLE
-- Each row represents a company/tenant using Ken-AI
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,          -- URL-friendly identifier
    logo_url        TEXT,
    description     TEXT,
    
    -- Contact information
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    website         TEXT,
    
    -- Organization settings (JSONB for flexibility)
    settings        JSONB DEFAULT '{}',
    -- Example settings:
    -- {
    --   "max_students": 500,
    --   "max_members": 20,
    --   "ai_model": "gemini-1.5-flash",
    --   "allowed_document_types": ["pdf", "jpg", "png"],
    --   "branding": { "primary_color": "#007AFF" }
    -- }
    
    -- Subscription and quota tracking
    plan            TEXT DEFAULT 'free',           -- 'free', 'starter', 'professional', 'enterprise'
    quota           JSONB DEFAULT '{}',
    -- Example quota:
    -- {
    --   "students": { "used": 45, "limit": 500 },
    --   "members": { "used": 8, "limit": 20 },
    --   "knowledge_articles": { "used": 120, "limit": 1000 }
    -- }
    
    -- Metadata
    is_active       BOOLEAN DEFAULT true,
    owner_id        UUID NOT NULL REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- Junction table linking users to organizations
-- ============================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            org_member_role NOT NULL DEFAULT 'member',
    status          org_member_status NOT NULL DEFAULT 'active',
    
    -- Invitation tracking
    invited_by      UUID REFERENCES profiles(id),
    invited_at      TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    
    -- Permission overrides (optional, empty = use role defaults)
    permissions     TEXT[] DEFAULT '{}',
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- ============================================
-- ORGANIZATION INVITATIONS TABLE
-- Manages pending invitations to join organizations
-- ============================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by      UUID NOT NULL REFERENCES profiles(id),
    email           TEXT NOT NULL,
    role            org_member_role NOT NULL DEFAULT 'counselor',
    message         TEXT,                        -- Optional message with invitation
    
    status          invitation_status NOT NULL DEFAULT 'pending',
    token           TEXT UNIQUE NOT NULL,        -- Unique token for invitation link
    expires_at      TIMESTAMPTZ NOT NULL,        -- Invitation expires after 7 days
    
    accepted_by     UUID REFERENCES profiles(id),
    accepted_at     TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Organization members indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(organization_id, status);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);
CREATE INDEX idx_org_members_active ON organization_members(user_id, status) WHERE status = 'active';

-- Organization invitations indexes
CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status);
CREATE INDEX idx_org_invitations_expires ON organization_invitations(expires_at);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

-- Auto-update updated_at on organizations
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on organization_members
CREATE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE organizations IS 'Organizations/tenants using Ken-AI platform';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization';
COMMENT ON COLUMN organizations.settings IS 'Organization-specific configuration (JSONB)';
COMMENT ON COLUMN organizations.quota IS 'Usage limits and current usage tracking (JSONB)';

COMMENT ON TABLE organization_members IS 'Junction table linking users to organizations with roles';
COMMENT ON COLUMN organization_members.role IS 'User role within this specific organization';
COMMENT ON COLUMN organization_members.status IS 'Membership status: pending, active, suspended, left';
COMMENT ON COLUMN organization_members.permissions IS 'Optional permission overrides for this member';

COMMENT ON TABLE organization_invitations IS 'Pending invitations to join organizations';
COMMENT ON COLUMN organization_invitations.token IS 'Unique token used in invitation URL';
COMMENT ON COLUMN organization_invitations.expires_at IS 'Invitation expiration timestamp (7 days from creation)';

COMMIT;
