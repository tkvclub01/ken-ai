# KEN AI — Đề Xuất Kiến Trúc Multi-Tenant

> **Phiên bản:** 1.0  
> **Ngày:** 05/04/2026  
> **Tác giả:** Super Z — AI Architecture Assistant  
> **Dự án:** Ken-AI (https://github.com/tkvclub01/ken-ai/)  
> **Mục tiêu:** Chuyển đổi Ken-AI từ mô hình single-tenant sang multi-tenant, cho phép nhiều công ty/cơ sở sử dụng hệ thống một cách độc lập, với dữ liệu và AI knowledge base tách biệt hoàn toàn theo từng tenant.

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Phân Tích Hiện Trạng](#2-phân-tích-hiện-trạng)
3. [Chiến Lược Multi-Tenant](#3-chiến-lược-multi-tenant)
4. [Thiết Kế Database Schema](#4-thiết-kế-database-schema)
5. [Cập Nhật RLS Policies](#5-cập-nhật-rls-policies)
6. [Luồng Xác Thực (Auth Flow)](#6-luồng-xác-thực-auth-flow)
7. [Phân Tách Knowledge Base Theo Tenant](#7-phân-tách-knowledge-base-theo-tenant)
8. [Quản Lý Thành Viên & Phân Quyền](#8-quản-lý-thành-viên--phân-quyền)
9. [Cập Nhật Edge Functions](#9-cập-nhật-edge-functions)
10. [Cập Nhật Middleware & Routing](#10-cập-nhật-middleware--routing)
11. [Frontend Changes](#11-frontend-changes)
12. [Migration Strategy — Chiến Lược Chuyển Đổi](#12-migration-strategy--chiến-lược-chuyển-đổi)
13. [Roadmap Phát Triển](#13-roadmap-phát-trển)
14. [Rủi Ro & Giải Pháp](#14-rủi-ro--giải-pháp)

---

## 1. Tổng Quan

### 1.1 Mục Tiêu Kiến Trúc

KEN AI hiện tại là một hệ thống **single-tenant** — tất cả dữ liệu (học sinh, tài liệu, knowledge base, hội thoại AI, audit log) nằm trong cùng một không gian, không có khái niệm "công ty" hay "cơ sở" nào ngăn cách dữ liệu giữa các nhóm người dùng. Mục tiêu của đề xuất này là chuyển đổi hệ thống sang mô hình **multi-tenant** với các yêu cầu cốt lõi sau:

- **Một người dùng đăng ký = một công ty (tenant):** Người dùng đầu tiên đăng ký sẽ tự động trở thành **Owner** của một tổ chức mới. Từ đó, họ có thể mời thêm nhân viên (counselor, processor, manager) và quản lý toàn bộ đội ngũ của mình.
- **Dữ liệu độc lập hoàn toàn theo tenant:** Mỗi công ty chỉ thấy được học sinh, tài liệu, knowledge base, hội thoại, analytics của chính mình. Không có khả năng truy cập dữ liệu cross-tenant.
- **AI Knowledge base riêng biệt:** Knowledge base (RAG) của mỗi tenant được xây dựng và quản lý riêng, đảm bảo AI trả lời dựa trên dữ liệu nội bộ của đúng công ty.
- **Phân quyền linh hoạt trong tenant:** Mỗi tenant có hệ thống RBAC riêng (admin, manager, counselor, processor) với quyền hạn có thể tùy chỉnh.

### 1.2 Các Nguyên Tắc Thiết Kế

Nguyên tắc thiết kế chính khi xây dựng kiến trúc multi-tenant cho Ken-AI bao gồm:

1. **Isolation by Design (Cách ly từ thiết kế):** Dữ liệu giữa các tenant phải được cách ly ở tầng database (RLS), không phụ thuộc vào logic application code. Dù frontend hay API có bug, dữ liệu tenant A không bao giờ bị lộ sang tenant B nhờ Row Level Security của PostgreSQL.
2. **Minimal Disruption (Thay đổi tối thiểu):** Tận dụng tối đa schema hiện có, chỉ thêm các bảng và cột cần thiết thay vì thiết kế lại toàn bộ. Hệ thống RBAC hiện tại với 4 roles và 24 permissions là nền tảng tốt, chỉ cần mở rộng thêm tổ chức.
3. **Backward Compatible (Tương thích ngược):** Migration phải cho phép dữ liệu hiện tại tiếp tục hoạt động. Tenant mặc định sẽ được tạo cho dữ liệu hiện có.
4. **Scalability (Khả năng mở rộng):** Kiến trúc hỗ trợ từ vài tenant (demo) đến hàng ngàn tenant (production) mà không cần thay đổi kiến trúc cốt lõi.

---

## 2. Phân Tích Hiện Trạng

### 2.1 Kiến Trúc Hiện Tại — Single Tenant

Hệ thống hiện tại có 14 bảng dữ liệu chính với các mối quan hệ phức tạp nhưng **hoàn toàn không có khái niệm organization/tenant**. Dưới đây là đánh giá chi tiết các module và mức độ ảnh hưởng khi chuyển sang multi-tenant:

| Module | Bảng Liên Quan | Có `organization_id`? | Mức Độ Thay Đổi |
|--------|---------------|----------------------|-----------------|
| Xác thực & Người dùng | `profiles` | ❌ | **Cao** — Cần bảng `organizations` + junction table |
| Quản lý học sinh | `students`, `documents`, `student_pipeline` | ❌ | **Trung bình** — Thêm `organization_id` FK |
| AI Knowledge Base | `knowledge_base`, `knowledge_categories` | ❌ | **Trung bình** — Thêm `organization_id`, cập nhật vector search |
| AI Chat | `conversations`, `conversation_messages` | ❌ | **Trung bình** — Thêm `organization_id` |
| Pipeline | `pipeline_stages`, `student_pipeline` | ❌ | **Thấp** — Pipeline stages có thể share, student_pipeline cần org scope |
| Templates & Logs | `email_templates`, `audit_logs` | ❌ | **Thấp** — Thêm `organization_id` FK |
| RBAC | `permissions`, `role_permissions` | N/A | **Trung bình** — Có thể share globally hoặc per-tenant |

### 2.2 Vấn Đề Cần Giải Quyết Khi Chuyển Multi-Tenant

Dựa trên phân tích schema hiện tại, dưới đây là các vấn đề chính cần giải quyết khi chuyển đổi sang multi-tenant. Đây là những điểm mấu chốt ảnh hưởng trực tiếp đến tính bảo mật và tính đúng đắn của dữ liệu:

**Vấn đề 1: Knowledge Base toàn cục (Global Knowledge Base)**
Hiện tại, tất cả articles trong `knowledge_base` đều visible cho mọi authenticated user có quyền `view_knowledge`. Khi có multi-tenant, company A không nên xem được knowledge base của company B. Đặc biệt quan trọng: AI chat search knowledge base cũng phải được scope theo tenant, nếu không AI sẽ trả lời dựa trên dữ liệu của tenant khác.

**Vấn đề 2: Students & Documents không có ranh giới tổ chức**
`students` table chỉ có `counselor_id` FK, không có cách nào biết học sinh này thuộc công ty nào. Counselor A ở company X có thể nhìn thấy học sinh của counselor B ở company Y nếu có permission `view_all_students`. Đây là lỗ hổng dữ liệu nghiêm trọng trong môi trường multi-tenant.

**Vấn đề 3: RLS Policies đang check bằng `auth.uid()` trực tiếp**
Hầu hết RLS policies hiện tại check quyền theo `auth.uid() = counselor_id` hoặc thông qua function `user_has_permission(auth.uid(), 'permission')`. Khi chuyển multi-tenant, mọi policy phải thêm điều kiện kiểm tra `organization_id` — cần một cách reliably xác định organization_id của user hiện tại.

**Vấn đề 4: `conversations_create` RLS không enforce user ownership**
Policy `conversations_create` hiện tại cho phép ANY authenticated user INSERT, không kiểm tra `user_id` có đúng là `auth.uid()` hay không. Trong multi-tenant, điều này còn nguy hiểm hơn vì có thể tạo conversation trong tenant sai.

**Vấn đề 5: Audit logs toàn cục**
`audit_logs` hiện tại visible cho tất cả admin/manager trong hệ thống. Trong multi-tenant, admin của company A không nên xem được audit log của company B.

### 2.3 Điểm Mạnh Có Thể Tận Dụng

May mắn là hệ thống hiện tại đã có sẵn một số nền tảng rất tốt cho multi-tenant, giúp giảm đáng kể công việc migration:

- **RBAC System hoàn chỉnh:** 4 roles (admin, manager, counselor, processor) với 24 permissions được quản lý qua `permissions` và `role_permissions` tables. Chỉ cần thêm abstraction layer "organization" lên trên hệ thống này.
- **Profiles có `invited_by` self-referential FK:** Gợi ý rằng hệ thống đã được thiết kế với tư duy phân cấp user, chỉ thiếu bậc "organization" ở trên.
- **Audit logging triggers sẵn có:** `log_audit_changes()` trigger đã hoạt động trên profiles, students, documents — chỉ cần thêm `organization_id` vào audit records.
- **Permission-based RLS:** RLS policies dùng `user_has_permission()` function thay vì check role cứng, rất dễ mở rộng thêm điều kiện org check.
- **Vector search function có sẵn:** `search_knowledge_base()` function có tham số filter, dễ thêm org_id vào WHERE clause.

---

## 3. Chiến Lược Multi-Tenant

### 3.1 So Sánh Các Mô Hình Multi-Tenant

Khi thiết kế kiến trúc multi-tenant cho ứng dụng SaaS, có ba mô hình chính cần cân nhắc. Mỗi mô hình có trade-off khác nhau về chi phí vận hành, mức độ cách ly, và độ phức tạp kỹ thuật:

| Tiêu chí | Schema-per-DB (Mỗi tenant 1 DB) | Schema-per-Tenant (Mỗi tenant 1 schema) | Shared-DB Shared-Schema (Chung DB, chung schema) |
|----------|------|------|------|
| **Cách ly dữ liệu** | Tuyệt đối (khác DB vật lý) | Cao (cùng DB, khác schema) | Trung bình (cùng DB, cùng schema) |
| **Chi phí vận hành** | Rất cao (N DB) | Cao (N schemas) | Thấp (1 DB) |
| **Phức tạp migration** | Rất cao | Cao | Thấp |
| **Khả năng scale** | Dễ scale per-tenant | Khó scale per-tenant | Dễ scale tổng thể |
| **Phù hợp Ken-AI?** | ❌ Overkill | ⚠️ Có thể nhưng phức tạp | ✅ Khuyến nghị |

### 3.2 Quyết Định: Shared-DB + Shared-Schema + Column-Based Isolation

**Giải pháp được đề xuất:** Sử dụng chung một PostgreSQL database và chung một schema, nhưng thêm cột `organization_id` vào mỗi bảng dữ liệu để phân cách dữ liệu giữa các tenant. Dữ liệu được cách ly thông qua **Row Level Security (RLS)** của PostgreSQL — đây là cơ chế an toàn nhất ở tầng database, không thể bị bypass bởi application code.

**Lý do chọn giải pháp này:**

1. **Supabase hosted PostgreSQL không hỗ trợ tạo nhiều database** trên cùng một project. Để dùng schema-per-tenant hoặc database-per-tenant, bạn phải tạo nhiều Supabase projects, dẫn đến phức tạp vận hành rất cao (mỗi project có riêng auth, storage, edge functions).
2. **Chi phí vận hành thấp nhất:** Chỉ cần 1 Supabase project, 1 database. Thêm tenant mới = thêm rows vào `organizations` table.
3. **Performance tốt cho số lượng tenant vừa phải (dưới 1,000 tenants):** Với proper indexes trên `organization_id`, PostgreSQL query performance không giảm đáng kể.
4. **Migration đơn giản nhất:** Từ schema hiện tại, chỉ cần thêm `organization_id` columns và update RLS policies.
5. **RLS đảm bảo security:** Dù application code có bug, data leakage không xảy ra vì RLS filter ở tầng database engine.

**Lưu ý về hạn chế:** Nếu Ken-AI scale lên hàng chục ngàn tenants với hàng triệu records mỗi tenant, nên cân nhắc chuyển sang Supabase Projects per Tenant (database-per-tenant) hoặc self-hosted PostgreSQL với schema-per-tenant. Nhưng với giai đoạn hiện tại, shared-schema là lựa chọn tối ưu nhất.

### 3.3 Kiến Trúc Tổng Thể

```
┌──────────────────────────────────────────────────────────────┐
│                     KEN AI — Multi-Tenant                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │Tenant A  │  │Tenant B  │  │Tenant C  │    ← Frontend UI    │
│  │ (Công ty │  │ (Cơ sở   │  │ (Trung   │                      │
│  │  Giáo dục│  │  Du học  │  │  Tư vấn) │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
│       │              │              │                           │
│  ┌────▼──────────────▼──────────────▼─────┐                   │
│  │          Next.js Middleware              │                   │
│  │   (Resolve tenant from session/URL)      │                   │
│  └──────────────────┬──────────────────────┘                   │
│                     │                                           │
│  ┌──────────────────▼──────────────────────┐                   │
│  │       Supabase (Single Database)          │                   │
│  │  ┌────────────────────────────────────┐  │                   │
│  │  │  organizations (tenant registry)   │  │                   │
│  │  │  organization_members (user↔org)   │  │                   │
│  │  └────────────────────────────────────┘  │                   │
│  │  ┌────────────────────────────────────┐  │                   │
│  │  │  RLS Policies filter EVERY query   │  │                   │
│  │  │  by organization_id = get_org()    │  │                   │
│  │  └────────────────────────────────────┘  │                   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │                   │
│  │  │profiles  │ │students  │ │knowledge │ │                   │
│  │  │org_id=X  │ │org_id=X  │ │org_id=X  │ │                   │
│  │  │org_id=Y  │ │org_id=Y  │ │org_id=Y  │ │                   │
│  │  └──────────┘ └──────────┘ └──────────┘ │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Thiết Kế Database Schema

### 4.1 Bảng Mới: `organizations`

Đây là bảng cốt lõi của kiến trúc multi-tenant — mỗi row đại diện cho một công ty/cơ sở sử dụng Ken-AI:

```sql
CREATE TABLE public.organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,          -- URL-friendly: 'tkv-club', 'vnu-consulting'
    logo_url        TEXT,
    description     TEXT,
    
    -- Thông tin liên hệ
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    website         TEXT,
    
    -- Cài đặt hệ thống
    settings        JSONB DEFAULT '{}',            -- Tùy chỉnh theo tenant
    -- Ví dụ settings:
    -- {
    --   "max_students": 500,
    --   "max_members": 20,
    --   "ai_model": "gemini-1.5-flash",
    --   "allowed_document_types": ["pdf", "jpg", "png"],
    --   "knowledge_base_limit": 1000,
    --   "pipeline_custom_stages": false,
    --   "branding": { "primary_color": "#007AFF", "logo_url": "..." }
    -- }
    
    -- Subscription / Quota
    plan            TEXT DEFAULT 'free',           -- 'free', 'starter', 'professional', 'enterprise'
    quota           JSONB DEFAULT '{}',
    -- Ví dụ quota:
    -- {
    --   "students": { "used": 45, "limit": 500 },
    --   "members": { "used": 8, "limit": 20 },
    --   "knowledge_articles": { "used": 120, "limit": 1000 },
    --   "storage_mb": { "used": 1024, "limit": 5120 },
    --   "ai_requests_monthly": { "used": 3500, "limit": 10000 }
    -- }
    
    -- Metadata
    is_active       BOOLEAN DEFAULT true,
    owner_id        UUID NOT NULL REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_plan ON organizations(plan);

-- Auto-update updated_at
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Giải thích các trường quan trọng:**

- **`slug`**: Định danh URL của tổ chức, dùng cho routing (ví dụ: `/dashboard/tkv-club/students`). Phải là unique và không thay đổi sau khi tạo.
- **`settings` (JSONB):** Cho phép mỗi tenant tùy chỉnh hệ thống theo nhu cầu riêng mà không cần thêm cột mới. Ví dụ: giới hạn loại tài liệu, model AI sử dụng, branding tùy chỉnh.
- **`plan` & `quota` (JSONB):** Hỗ trợ hệ thống subscription/plan-based. Mỗi plan có giới hạn khác nhau về số học sinh, thành viên, articles, storage, và AI requests. Giới hạn được enforce ở cả tầng application và database.
- **`owner_id`**: FK đến profiles — người tạo tổ chức, có quyền cao nhất (super admin của tenant đó).

### 4.2 Bảng Mới: `organization_members`

Junction table quản lý mối quan hệ giữa user và organization. Một user có thể thuộc nhiều organization (nhưng trong thực tế Ken-AI, thường là 1:1):

```sql
CREATE TABLE public.organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member',
    -- Roles: 'owner', 'admin', 'manager', 'counselor', 'processor', 'member'
    
    -- Trạng thái lời mời
    status          TEXT NOT NULL DEFAULT 'active',
    -- Statuses: 'pending', 'active', 'suspended', 'left'
    invited_by      UUID REFERENCES profiles(id),
    invited_at      TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    
    -- Cài đặt cá nhân trong org
    permissions     TEXT[] DEFAULT '{}',  -- Override permissions (optional)
    -- Nếu null hoặc empty, dùng default permissions theo role
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(organization_id, status);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);

-- Trigger: auto-update updated_at
CREATE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Constraint: Owner phải là member
ALTER TABLE organizations ADD CONSTRAINT chk_owner_is_member 
    CHECK (EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = id AND user_id = owner_id AND role = 'owner'
    ));
```

**Giải thích thiết kế:**

- **`role` trong organization_members vs `role` trong profiles:** Đây là hai khái niệm khác nhau. `profiles.role` là role toàn hệ thống (hiện tại dùng cho RBAC). `organization_members.role` là role cụ thể trong một tổ chức. Trong kiến trúc mới, **`organization_members.role` sẽ là source of truth** cho RBAC, còn `profiles.role` chỉ dùng cho các tác vụ cross-tenant (nếu có).
- **`status` lifecycle:** `pending` → user nhận được lời mời nhưng chưa chấp nhận → `active` → user tham gia → `suspended` → bị khóa bởi admin → `left` → user tự rời.
- **`permissions` override:** Cho phép admin tenant tùy chỉnh quyền cho từng member cá nhân, ví dụ counselor A có thêm quyền `verify_documents` mặc dù counselor mặc định không có.

### 4.3 Bảng Mới: `organization_invitations`

Bảng quản lý lời mời tham gia tổ chức — tách riêng từ `organization_members` để rõ ràng hơn:

```sql
CREATE TABLE public.organization_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by      UUID NOT NULL REFERENCES profiles(id),
    email           TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'counselor',
    message         TEXT,                        -- Tin nhắn kèm lời mời
    status          TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'accepted', 'rejected', 'expired', 'cancelled'
    
    token           TEXT UNIQUE NOT NULL,        -- Unique token cho link mời
    expires_at      TIMESTAMPTZ NOT NULL,        -- Hết hạn sau 7 ngày
    
    accepted_by     UUID REFERENCES profiles(id),
    accepted_at     TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status);
```

### 4.4 Bảng Mới: `organization_subscriptions` (Tương Lai)

```sql
-- Dành cho Phase 2: Quản lý subscription/billing
CREATE TABLE public.organization_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    -- 'active', 'past_due', 'cancelled', 'trialing'
    
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    
    -- Stripe integration (nếu dùng)
    stripe_customer_id   TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id      TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Bảng Mới: `organization_audit_logs`

```sql
-- Audit log riêng cho organization events (thành viên tham gia/rời, thay đổi settings)
CREATE TABLE public.organization_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    -- 'member_invited', 'member_joined', 'member_removed', 'member_role_changed',
    -- 'settings_changed', 'plan_changed', 'owner_transferred'
    
    actor_id        UUID NOT NULL REFERENCES profiles(id),
    target_id       UUID REFERENCES profiles(id),   -- User bị tác động
    details         JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_audit_logs_org ON organization_audit_logs(organization_id);
CREATE INDEX idx_org_audit_logs_action ON organization_audit_logs(organization_id, action);
```

### 4.6 Cập Nhật Bảng Hiện Tại — Thêm `organization_id`

Mọi bảng chứa dữ liệu business cần thêm cột `organization_id` để phân cách theo tenant:

```sql
-- ============================================
-- PROFILES: Thêm organization_id
-- ============================================
ALTER TABLE public.profiles 
    ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Mỗi user chỉ thuộc 1 organization (có thể null nếu chưa join)
CREATE INDEX idx_profiles_organization ON profiles(organization_id);

-- ============================================
-- STUDENTS: Thêm organization_id
-- ============================================
ALTER TABLE public.students 
    ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

CREATE INDEX idx_students_organization ON students(organization_id);
-- Composite index cho query thường gặp
CREATE INDEX idx_students_org_counselor ON students(organization_id, counselor_id);
CREATE INDEX idx_students_org_status ON students(organization_id, status);

-- ============================================
-- DOCUMENTS: Thêm organization_id (thông qua students)
-- ============================================
-- Documents không cần organization_id trực tiếp vì đã có FK → students
-- Nhưng thêm để query nhanh hơn, tránh JOIN
ALTER TABLE public.documents 
    ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_documents_organization ON documents(organization_id);

-- ============================================
-- KNOWLEDGE_BASE: Thêm organization_id
-- ============================================
ALTER TABLE public.knowledge_base 
    ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

CREATE INDEX idx_knowledge_organization ON knowledge_base(organization_id);
-- Index hỗ trợ vector search + org filter
CREATE INDEX idx_knowledge_org_category ON knowledge_base(organization_id, category_id);

-- ============================================
-- KNOWLEDGE_CATEGORIES: Thêm organization_id
-- ============================================
ALTER TABLE public.knowledge_categories 
    ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_knowledge_categories_org ON knowledge_categories(organization_id);

-- ============================================
-- CONVERSATIONS: Thêm organization_id
-- ============================================
ALTER TABLE public.conversations 
    ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

CREATE INDEX idx_conversations_organization ON conversations(organization_id);

-- ============================================
-- EMAIL_TEMPLATES: Thêm organization_id
-- ============================================
ALTER TABLE public.email_templates 
    ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

CREATE INDEX idx_email_templates_organization ON email_templates(organization_id);

-- ============================================
-- PIPELINE_STAGES: Thêm organization_id
-- ============================================
ALTER TABLE public.pipeline_stages 
    ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_pipeline_stages_organization ON pipeline_stages(organization_id);

-- ============================================
-- AUDIT_LOGS: Thêm organization_id
-- ============================================
ALTER TABLE public.audit_logs 
    ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
```

### 4.7 Database Function Mới: `get_current_organization_id()`

Đây là function quan trọng nhất — được sử dụng trong TẤT CẢ RLS policies để xác định tenant hiện tại:

```sql
-- Lấy organization_id của user hiện tại
-- Trả về NULL nếu user không thuộc organization nào
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

-- Version stricter: fail nếu user không có org
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
```

### 4.8 Cập Nhật Function `user_has_permission()`

Function hiện tại cần được cập nhật để check permission theo context của organization:

```sql
-- Cập nhật: Check permission theo role trong organization
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Bỏ qua cho service_role
    SELECT EXISTS (
        SELECT 1 
        FROM pg_auth_members 
        WHERE member = (SELECT usesysid FROM pg_user WHERE usename = current_user)
          AND roleid = (SELECT oid FROM pg_roles WHERE rolname = 'service_role')
    )
    UNION ALL
    -- Check theo role trong organization_members
    SELECT EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        JOIN public.organization_members om 
            ON om.role = rp.role
            AND om.status = 'active'
        WHERE om.user_id = p_user_id
          AND rp.permission_id = (
              SELECT id FROM public.permissions WHERE name = p_permission
          )
    )
    LIMIT 1;
$$;
```

### 4.9 ERD Mới — Multi-Tenant Ken-AI

```
┌─────────────────────┐
│   organizations      │
│─────────────────────│
│ id (PK)             │
│ name                │
│ slug (UNIQUE)       │
│ logo_url            │
│ settings (JSONB)    │
│ plan                │
│ quota (JSONB)       │
│ owner_id → profiles │
│ is_active           │
└──────────┬──────────┘
           │
     ┌─────┴─────────────────────────────────────┐
     │                                           │
     ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────┐
│ organization_members  │              │ organization_invites │
│──────────────────────│              │──────────────────────│
│ id (PK)              │              │ id (PK)              │
│ organization_id (FK) │              │ organization_id (FK) │
│ user_id (FK)         │              │ invited_by (FK)      │
│ role                 │              │ email                │
│ status               │              │ role                 │
│ invited_by (FK)      │              │ token (UNIQUE)       │
│ permissions (TEXT[]) │              │ status               │
└──────────────────────┘              │ expires_at           │
                                     └──────────────────────┘

  organization_id được thêm vào:
  ┌──────────────────────────────────────────────┐
  │  profiles.organizations_id  (nullable)       │
  │  students.organization_id    (NOT NULL)      │
  │  documents.organization_id   (FK)            │
  │  knowledge_base.organization_id (NOT NULL)   │
  │  knowledge_categories.organization_id (FK)   │
  │  conversations.organization_id (NOT NULL)    │
  │  email_templates.organization_id (NOT NULL)  │
  │  pipeline_stages.organization_id (FK)        │
  │  audit_logs.organization_id   (FK)           │
  └──────────────────────────────────────────────┘
```

---

## 5. Cập Nhật RLS Policies

### 5.1 Nguyên Tắc Cập Nhật RLS

Tất cả RLS policies phải tuân thủ nguyên tắc: **Mọi query phải filter bởi `organization_id = get_current_organization_id()`**. Điều này đảm bảo data isolation ở tầng database. Dưới đây là pattern chuẩn cho mọi policy:

```sql
-- Pattern chuẩn cho SELECT policy
CREATE POLICY "table_select" ON public.table_name
    FOR SELECT
    TO authenticated
    USING (
        organization_id = get_current_organization_id()
        -- + điều kiện nghiệp vụ hiện tại (permission, ownership, v.v.)
    );

-- Pattern chuẩn cho INSERT policy
CREATE POLICY "table_insert" ON public.table_name
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        -- + điều kiện nghiệp vụ hiện tại
    );

-- Pattern chuẩn cho UPDATE policy  
CREATE POLICY "table_update" ON public.table_name
    FOR UPDATE
    TO authenticated
    USING (
        organization_id = get_current_organization_id()
    )
    WITH CHECK (
        organization_id = get_current_organization_id()
    );

-- Pattern chuẩn cho DELETE policy
CREATE POLICY "table_delete" ON public.table_name
    FOR DELETE
    TO authenticated
    USING (
        organization_id = get_current_organization_id()
    );
```

### 5.2 RLS Policies Cập Nhật Chi Tiết

#### `profiles`

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies cũ
DROP POLICY IF EXISTS users_view_own_profile ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_data ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own_only ON public.profiles;
DROP POLICY IF EXISTS service_manage_profiles ON public.profiles;

-- User xem profile của chính mình (cross-org không giới hạn cho chính mình)
CREATE POLICY "profiles_view_self" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Admin/Manager xem profiles trong cùng organization
CREATE POLICY "profiles_view_org_members" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'view_users')
    );

-- User cập nhật profile của chính mình
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin cập nhật member trong org
CREATE POLICY "profiles_update_org_members" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'edit_users')
    );

-- Auto-create profile on signup (cho trigger)
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Service role full access
CREATE POLICY "profiles_service_role" ON public.profiles
    FOR ALL TO service_role
    USING (true);
```

#### `students`

```sql
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop policies cũ
DROP POLICY IF EXISTS students_view_assigned_or_all ON public.students;
DROP POLICY IF EXISTS students_create ON public.students;
DROP POLICY IF EXISTS students_update ON public.students;
DROP POLICY IF EXISTS students_delete ON public.students;

-- Xem học sinh trong organization của mình
CREATE POLICY "students_view_org" ON public.students
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND (
            counselor_id = auth.uid()           -- Học sinh được assign cho mình
            OR user_has_permission(auth.uid(), 'view_all_students')  -- Có quyền xem tất cả
        )
    );

-- Tạo học sinh trong organization
CREATE POLICY "students_create_org" ON public.students
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'create_students')
    );

-- Cập nhật học sinh trong organization
CREATE POLICY "students_update_org" ON public.students
    FOR UPDATE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'edit_students')
        AND (
            counselor_id = auth.uid()
            OR user_has_permission(auth.uid(), 'view_all_students')
        )
    );

-- Xóa học sinh trong organization
CREATE POLICY "students_delete_org" ON public.students
    FOR DELETE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'delete_students')
    );
```

#### `knowledge_base` — Quan Trọng Nhất Cho AI

```sql
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_view ON public.knowledge_base;
DROP POLICY IF EXISTS knowledge_create ON public.knowledge_base;
DROP POLICY IF EXISTS knowledge_edit ON public.knowledge_base;
DROP POLICY IF EXISTS knowledge_delete ON public.knowledge_base;

-- CHỈ xem knowledge base của chính organization mình
CREATE POLICY "knowledge_view_org" ON public.knowledge_base
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'view_knowledge')
    );

-- Tạo knowledge trong organization
CREATE POLICY "knowledge_create_org" ON public.knowledge_base
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'create_knowledge')
    );

-- Chỉnh sửa knowledge trong organization
CREATE POLICY "knowledge_edit_org" ON public.knowledge_base
    FOR UPDATE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'edit_knowledge')
    );

-- Xóa knowledge trong organization
CREATE POLICY "knowledge_delete_org" ON public.knowledge_base
    FOR DELETE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'delete_knowledge')
    );
```

#### `conversations`

```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_view ON public.conversations;
DROP POLICY IF EXISTS conversations_create ON public.conversations;
DROP POLICY IF EXISTS conversations_update ON public.conversations;
DROP POLICY IF EXISTS conversations_delete ON public.conversations;

-- Xem conversation trong org (của mình hoặc có quyền view_all)
CREATE POLICY "conversations_view_org" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = auth.uid()
            OR user_has_permission(auth.uid(), 'view_all_students')
        )
    );

-- Tạo conversation trong org — FIX: enforce user_id = auth.uid()
CREATE POLICY "conversations_create_org" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        AND user_id = auth.uid()    -- ← FIX quan trọng: trước đó không check
    );

-- Cập nhật conversation trong org
CREATE POLICY "conversations_update_org" ON public.conversations
    FOR UPDATE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = auth.uid()
            OR user_has_permission(auth.uid(), 'view_all_students')
        )
    );

-- Xóa conversation trong org
CREATE POLICY "conversations_delete_org" ON public.conversations
    FOR DELETE TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND (
            user_id = auth.uid()
            OR user_has_permission(auth.uid(), 'delete_students')
        )
    );
```

#### `documents`

```sql
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Tương tự pattern trên, thêm organization_id filter
CREATE POLICY "documents_view_org" ON public.documents
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'view_documents')
    );

CREATE POLICY "documents_upload_org" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'upload_documents')
    );

-- ... tương tự cho UPDATE và DELETE
```

#### `audit_logs`

```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ xem audit logs của chính organization mình
CREATE POLICY "audit_logs_view_org" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
        AND user_has_permission(auth.uid(), 'view_analytics')
    );
```

#### `pipeline_stages`, `email_templates`, `knowledge_categories`

```sql
-- BẮT BUỘC: Enable RLS cho các tables chưa có RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Pipeline stages: xem trong org hoặc system defaults
CREATE POLICY "pipeline_stages_view" ON public.pipeline_stages
    FOR SELECT TO authenticated
    USING (
        organization_id IS NULL  -- System defaults (visible cho tất cả)
        OR organization_id = get_current_organization_id()
    );

-- Email templates: scoped theo org
CREATE POLICY "email_templates_view_org" ON public.email_templates
    FOR SELECT TO authenticated
    USING (
        organization_id = get_current_organization_id()
    );
```

### 5.3 Cập Nhật `search_knowledge_base()` Function

Function search knowledge base phải được scope theo organization_id:

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
    WHERE kb.organization_id = get_current_organization_id()  -- ← THÊM DÒNG NÀY
      AND 1 - (kb.embedding <=> query_embedding) > match_threshold
      AND (p_category_id IS NULL OR kb.category_id = p_category_id)
      AND (p_only_verified = false OR kb.verified = true)
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
$$;
```

---

## 6. Luồng Xác Thực (Auth Flow)

### 6.1 Luồng Đăng Ký Tạo Tổ Chức Mới

Đây là luồng quan trọng nhất — khi người dùng đăng ký lần đầu, họ tự động tạo một tổ chức mới:

```
┌─────────────────────────────────────────────────────────────────┐
│              FLOW: Đăng Ký & Tạo Tổ Chức                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User đi đến trang đăng ký                                    │
│     ┌──────────────────────────────────────────┐                │
│     │  Tên đầy đủ: Nguyễn Văn A                 │                │
│     │  Email: nguyenvana@tkvclub.com           │                │
│     │  Mật khẩu: ********                      │                │
│     │  Tên công ty: TKV Education Club         │  ← MỚI          │
│     │  Slug: tkv-education-club                │  ← MỚI          │
│     └──────────────────────────────────────────┘                │
│                        │                                         │
│                        ▼                                         │
│  2. Client gọi API: POST /api/organizations/register            │
│     Body: { name, email, password, org_name, org_slug }         │
│                        │                                         │
│                        ▼                                         │
│  3. Server xử lý (TRONG TRANSACTION):                            │
│     ┌─────────────────────────────────────────────┐              │
│     │ a) supabase.auth.signUp({ email, password })│              │
│     │ b) INSERT INTO organizations                │              │
│     │    (name, slug, owner_id)                   │              │
│     │ c) INSERT INTO organization_members          │              │
│     │    (organization_id, user_id, role: 'owner')│              │
│     │ d) UPDATE profiles SET                      │              │
│     │    organization_id = org.id                 │              │
│     │ e) Seed pipeline_stages cho org             │              │
│     │ f) Seed knowledge_categories cho org        │              │
│     │ g) Seed email_templates cho org             │              │
│     └─────────────────────────────────────────────┘              │
│                        │                                         │
│                        ▼                                         │
│  4. Redirect sang Dashboard với org context                      │
│     URL: /dashboard/tkv-education-club                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Luồng Mời Thành Viên

```
┌─────────────────────────────────────────────────────────────────┐
│              FLOW: Mời Thành Viên                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin/Owner vào trang Quản lý nhân viên                      │
│     Click "Mời thành viên mới"                                   │
│                        │                                         │
│                        ▼                                         │
│  2. Nhập email và chọn role                                     │
│     ┌──────────────────────────────────────────┐                │
│     │  Email: counselor_b@gmail.com             │                │
│     │  Role:  [Counselor ▼]                     │                │
│     │  Ghi chú: "Mời bạn vào TKV Club"          │                │
│     └──────────────────────────────────────────┘                │
│                        │                                         │
│                        ▼                                         │
│  3. POST /api/organizations/{org_id}/invitations                │
│     Server xử lý:                                                │
│     a) Kiểm tra user có quyền invite_users                       │
│     b) Tạo invitation record (token random, expires 7 ngày)     │
│     c) Gửi email mời qua Supabase (hoặc Resend/SendGrid)        │
│        Link: https://ken-ai.com/invite/{token}                   │
│                        │                                         │
│                        ▼                                         │
│  4. Người được mời click link:                                   │
│     - Chưa có tài khoản → Redirect sang trang đăng ký            │
│       Sau signup, tự động join org                               │
│     - Đã có tài khoản → Tự động join org                         │
│                        │                                         │
│                        ▼                                         │
│  5. Accept invitation:                                           │
│     a) INSERT INTO organization_members (active)                 │
│     b) UPDATE profiles SET organization_id                       │
│     c) UPDATE organization_invitations SET status='accepted'     │
│     d) Redirect sang dashboard của org                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Luồng Login Với Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────┐
│              FLOW: Login                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User đăng nhập (email + password)                            │
│     supabase.auth.signInWithPassword({ email, password })       │
│                        │                                         │
│                        ▼                                         │
│  2. Server fetch profile + organization:                         │
│     SELECT p.*, o.slug, o.name as org_name                       │
│     FROM profiles p                                              │
│     JOIN organizations o ON o.id = p.organization_id             │
│     WHERE p.id = auth.uid()                                     │
│                        │                                         │
│                        ▼                                         │
│  3. Phân loại:                                                   │
│     ┌─────────────────────────────────────────────┐              │
│     │ Có organization_id → Redirect:              │              │
│     │   /dashboard/{org_slug}                      │              │
│     │                                             │              │
│     │ Có pending invitation → Redirect:           │              │
│     │   /invite/{token}                           │              │
│     │                                             │              │
│     │ Không có org + không có invitation →        │              │
│     │   Redirect: /onboarding                     │              │
│     │   (Chọn: Tạo org mới hoặc Nhập code mời)    │              │
│     └─────────────────────────────────────────────┘              │
│                        │                                         │
│                        ▼                                         │
│  4. Lưu org context vào session/JWT claims                      │
│     - org_id vào JWT custom claims hoặc cookie riêng             │
│     - Middleware đọc org_id để routing                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Luồng Chuyển Đổi Tổ Chức (Nâng Cao — Phase 2)

Cho user thuộc nhiều organization:

```
┌──────────────────────────────────────────┐
│  User Login → /dashboard/switch          │
│  ┌────────────────────────────────────┐  │
│  │  Tổ chức 1: TKV Education (Owner)  │  │
│  │  Tổ chức 2: VNU Consulting (Admin) │  │
│  │  [+ Tạo tổ chức mới]               │  │
│  └────────────────────────────────────┘  │
│           Chọn tổ chức                   │
│           → /dashboard/{org_slug}         │
└──────────────────────────────────────────┘
```

---

## 7. Phân Tách Knowledge Base Theo Tenant

### 7.1 Tại Sao Knowledge Base Phải Tách?

Knowledge base (RAG) là module quan trọng nhất cần tách theo tenant vì lý do bảo mật dữ liệu nội bộ. Mỗi công ty tư vấn du học có thông tin riêng về trường hợp, chính sách visa, học bổng, quy trình xử lý hồ sơ mà không muốn chia sẻ với công ty khác. Nếu knowledge base toàn cục, AI có thể trích xuất thông tin từ company A để trả lời cho user của company B — đây là rò rỉ dữ liệu nghiêm trọng.

### 7.2 Kiến Trúc Knowledge Base Multi-Tenant

```
┌────────────────────────────────────────────────────────────┐
│              Knowledge Base Multi-Tenant                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Tenant A KB     │  │  Tenant B KB     │                │
│  │  ┌─────────────┐│  │  ┌─────────────┐│                 │
│  │  │ Categories  ││  │  │ Categories  ││                 │
│  │  │ - Úc        ││  │  │ - Anh       ││                 │
│  │  │ - Canada    ││  │  │ - Mỹ        ││                 │
│  │  │ - Nhật Bản  ││  │  │ - Canada    ││                 │
│  │  └─────────────┘│  │  └─────────────┘│                 │
│  │  ┌─────────────┐│  │  ┌─────────────┐│                 │
│  │  │ Articles    ││  │  │ Articles    ││                 │
│  │  │ (500 articles│ │  │  │ (300 articles│                 │
│  │  │  org_id=A)  ││  │  │  org_id=B)  ││                 │
│  │  │             ││  │  │             ││                 │
│  │  │ Embeddings: ││  │  │ Embeddings: ││                 │
│  │  │ vector(768) ││  │  │ vector(768) ││                 │
│  │  └─────────────┘│  │  └─────────────┘│                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐                                        │
│  │  System KB      │  ← Optional: Knowledge base dùng chung │
│  │  (org_id=NULL)  │    cho tất cả tenants (Supabase KB,   │
│  │  General info   │    Visa general knowledge, etc.)      │
│  └─────────────────┘                                        │
│                                                             │
│  AI Search Flow:                                            │
│  1. User hỏi câu hỏi                                        │
│  2. Generate embedding từ câu hỏi                           │
│  3. search_knowledge_base(embedding, org_id=current_org)   │
│  4. AI trả lời dựa trên KẾT QUẢ TỪ ORG CỦA USER          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 7.3 Vector Index Tối Ưu Cho Multi-Tenant

Với multi-tenant, cần tối ưu vector index để search nhanh hơn khi có nhiều organizations:

```sql
-- Drop index cũ
DROP INDEX IF EXISTS idx_knowledge_base_embedding_ivfflat;

-- Tạo index mới với partition-aware approach
-- IVFFlat index tốt cho datasets vừa (dưới 1M rows)
-- Cho datasets lớn hơn, cân nhắc HNSW index (PostgreSQL 17+)

-- Cách 1: Single index (đơn giản, đủ dùng cho < 100K articles total)
CREATE INDEX idx_kb_embedding_ivfflat 
    ON public.knowledge_base 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);  -- Tăng lists khi tổng articles tăng

-- Cách 2: Partial index per organization (cho performance tốt hơn)
-- Chỉ tạo khi cần thiết (nhiều large tenants)
-- CREATE INDEX idx_kb_embedding_tenant_A 
--     ON public.knowledge_base 
--     USING ivfflat (embedding vector_cosine_ops)
--     WHERE organization_id = 'uuid-of-tenant-A';
```

### 7.4 Seed Knowledge Base Per Tenant

Khi tạo organization mới, cần seed dữ liệu mặc định:

```sql
-- Function seed default data cho tenant mới
CREATE OR REPLACE FUNCTION seed_tenant_data(p_org_id UUID, p_owner_id UUID)
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

## 8. Quản Lý Thành Viên & Phân Quyền

### 8.1 Vai Trò Trong Tenant

Mỗi organization có các vai trò sau, tương thích với hệ thống RBAC hiện tại:

| Vai Trò | Mô Tả | Có Thể |
|---------|-------|--------|
| **Owner** | Người sáng lập/tạo tổ chức | Mọi quyền + chuyển quyền Owner + xóa tổ chức |
| **Admin** | Quản trị viên cấp cao | Mời/thêm/xóa thành viên + thay đổi settings + mọi quyền nghiệp vụ |
| **Manager** | Quản lý cấp trung | Xem tất cả học sinh + analytics + quản lý pipeline + mời member |
| **Counselor** | Cố vấn học tập | Xem học sinh được assign + upload tài liệu + chat AI + xem KB |
| **Processor** | Xử lý hồ sơ | Xem tất cả tài liệu + verify tài liệu + xem KB |
| **Member** | Thành viên cơ bản (tùy chỉnh) | Quyền tùy chỉnh qua `permissions` override |

### 8.2 Permission Matrix Per Tenant Role

Giữ nguyên 24 permissions hiện tại nhưng thêm quyền liên quan đến organization:

| Permission Mới | Owner | Admin | Manager | Counselor | Processor |
|---------------|-------|-------|---------|-----------|-----------|
| `manage_organization` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `invite_members` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `remove_members` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `change_member_role` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `view_org_settings` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `edit_org_settings` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `view_org_analytics` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `transfer_ownership` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `delete_organization` | ✅ | ❌ | ❌ | ❌ | ❌ |

### 8.3 API Endpoints Quản Lý Thành Viên

```
# Organization Management
POST   /api/organizations              → Tạo tổ chức mới
GET    /api/organizations              → Danh sách org của user
GET    /api/organizations/:org_id      → Chi tiết tổ chức
PUT    /api/organizations/:org_id      → Cập nhật settings
DELETE /api/organizations/:org_id      → Xóa tổ chức (chỉ Owner)

# Member Management
GET    /api/organizations/:org_id/members           → Danh sách thành viên
POST   /api/organizations/:org_id/invitations       → Mời thành viên
GET    /api/organizations/:org_id/invitations       → Danh sách lời mời
POST   /api/invitations/:token/accept               → Chấp nhận lời mời
POST   /api/invitations/:token/reject               → Từ chối lời mời
PUT    /api/organizations/:org_id/members/:user_id  → Đổi role thành viên
DELETE /api/organizations/:org_id/members/:user_id  → Xóa thành viên

# Tenant Switching (Phase 2)
POST   /api/organizations/:org_id/switch            → Chuyển sang org khác
```

---

## 9. Cập Nhật Edge Functions

### 9.1 Vấn Đề Hiện Tại

Hiện tại có 2 edge functions (`ingest-knowledge` và `process-document`) đang dùng **service_role key** — bypass tất cả RLS policies. Đây vừa là vấn đề bảo mật P0 (đã phát hiện trong audit), vừa là vấn đề multi-tenant (bypass RLS = bypass org isolation).

### 9.2 Cập Nhật Edge Functions Cho Multi-Tenant

**Nguyên tắc:** TẤT CẢ edge functions phải nhận `organization_id` từ client và chỉ thao tác trên dữ liệu của organization đó. Nếu dùng anon key, RLS tự động filter. Nếu phải dùng service_role (cho embedding), cần tự filter trong code.

#### `ingest-knowledge` Edge Function

```typescript
// supabase/functions/ingest-knowledge/index.ts
// CẬP NHẬT: Thêm organization_id vào logic

Deno.serve(async (req: Request) => {
  const { title, content, category_id, tags, organization_id } = await req.json();
  
  // 1. Verify user belongs to organization
  const authHeader = req.headers.get('Authorization')!;
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, 
    Deno.env.get('SUPABASE_ANON_KEY')!, {  // ← Dùng ANON KEY
      global: { headers: { Authorization: authHeader } }
    });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  // 2. Verify user is member of this organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .eq('status', 'active')
    .single();
  
  if (!member) return new Response('Not a member of this organization', { status: 403 });
  
  // 3. Generate embedding
  const embedding = await generateEmbedding(content);
  
  // 4. Insert with organization_id — RLS will enforce
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      title, content, category_id, tags,
      organization_id,  // ← THÊM: Scope theo organization
      embedding,
      created_by: user.id
    })
    .select()
    .single();
  
  return Response.json({ data });
});
```

#### `process-document` Edge Function

```typescript
// supabase/functions/process-document/index.ts
// CẬP NHẬT: Thêm organization_id

Deno.serve(async (req: Request) => {
  const { document_id, organization_id } = await req.json();
  
  // 1. Auth + verify organization membership
  const supabase = createClient(/* anon key with auth header */);
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Verify document belongs to user's organization
  const { data: document } = await supabase
    .from('documents')
    .select('id, organization_id, student_id')
    .eq('id', document_id)
    .eq('organization_id', organization_id)  // ← Thêm org check
    .single();
  
  if (!document) return new Response('Document not found', { status: 404 });
  
  // 3. Process document (OCR, chunking, embedding)
  // ... existing logic ...
  
  // 4. Save knowledge base entries with organization_id
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    await supabase.from('knowledge_base').insert({
      title: `${document.file_name} - Chunk ${chunk.index}`,
      content: chunk.content,
      organization_id,  // ← THÊM: Scope theo organization
      embedding,
      created_by: user.id
    });
  }
});
```

#### `streamAIResponse` Edge Function

```typescript
// supabase/functions/streamAIResponse/index.ts
// CẬP NHẬT: Knowledge search scoped by organization

Deno.serve(async (req: Request) => {
  const { messages, conversation_id, organization_id } = await req.json();
  
  // 1. Auth + verify org membership
  const supabase = createClient(/* anon key with auth header */);
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Search knowledge base — ONLY from user's organization
  const { data: queryEmbedding } = await supabase.rpc('search_knowledge_base', {
    query_embedding: await generateEmbedding(lastUserMessage),
    match_threshold: 0.7,
    match_count: 5,
    // organization_id is automatically filtered via RLS
    // because function uses get_current_organization_id()
  });
  
  // 3. Generate AI response with org-scoped context
  const context = queryEmbedding.map(r => r.content).join('\n');
  const systemPrompt = `
    Bạn là trợ lý AI cho công ty tư vấn du học.
    Chỉ trả lời dựa trên thông tin sau (knowledge base nội bộ):
    ${context}
    
    Nếu không tìm thấy thông tin, hãy nói rằng bạn không có thông tin 
    về câu hỏi này trong cơ sở dữ liệu của công ty.
  `;
  
  // 4. Stream response
  // ... existing streaming logic ...
});
```

---

## 10. Cập Nhật Middleware & Routing

### 10.1 Multi-Tenant Routing Strategy

Có 2 approach chính cho routing:

| Approach | URL Pattern | Ưu Điểm | Nhược Điểm |
|----------|-------------|---------|------------|
| **Subdomain** | `tkvclub.ken-ai.com` | Branding tốt, cách ly rõ | Cần DNS wildcard, phức tạp hơn |
| **Path-based** | `ken-ai.com/dashboard/tkv-club` | Đơn giản, dễ deploy | Có thể conflict với routes khác |

**Khuyến nghị:** Dùng **Path-based** cho giai đoạn đầu, chuyển sang **Subdomain** khi production scale.

### 10.2 Cập Nhật Middleware

```typescript
// middleware.ts — Cập nhật cho multi-tenant

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value))
          const response = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
          return response
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes — no auth required
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/callback']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Protected routes — require auth
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Extract organization slug from URL: /dashboard/[orgSlug]/...
  const orgSlugMatch = pathname.match(/^\/dashboard\/([a-z0-9-]+)(\/|$)/)
  const urlOrgSlug = orgSlugMatch ? orgSlugMatch[1] : null

  // Fetch user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  // Fetch organization details
  let currentOrg = null
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, slug, name')
      .eq('id', profile.organization_id)
      .eq('is_active', true)
      .single()
    currentOrg = org
  }

  // Redirect to correct org slug if needed
  if (currentOrg && urlOrgSlug && urlOrgSlug !== currentOrg.slug) {
    const correctedPath = pathname.replace(
      `/dashboard/${urlOrgSlug}`, 
      `/dashboard/${currentOrg.slug}`
    )
    return NextResponse.redirect(new URL(correctedPath, request.url))
  }

  // Redirect to org dashboard if no slug in URL
  if (currentOrg && !urlOrgSlug && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(
      new URL(`/dashboard/${currentOrg.slug}`, request.url)
    )
  }

  // Redirect to onboarding if no organization
  if (!currentOrg && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Role-based route protection (giữ nguyên logic hiện tại)
  // ...

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 10.3 Layout Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx                    ← Cập nhật: thêm form org name/slug
│   └── callback/route.ts
├── (app)/
│   ├── layout.tsx                            ← App layout with sidebar
│   └── dashboard/
│       └── [orgSlug]/                       ← Dynamic segment cho org
│           ├── layout.tsx                    ← Org context provider
│           ├── page.tsx                      → Dashboard overview
│           ├── students/page.tsx
│           ├── documents/page.tsx
│           ├── knowledge/page.tsx
│           ├── chat/page.tsx
│           ├── analytics/page.tsx
│           ├── pipeline/page.tsx
│           └── settings/
│               ├── general/page.tsx
│               ├── members/page.tsx          ← MỚI: Quản lý thành viên
│               ├── invitations/page.tsx      ← MỚI: Quản lý lời mời
│               └── billing/page.tsx          ← MỚI: Quản lý subscription
├── onboarding/
│   └── page.tsx                              ← MỚI: Trang onboarding
├── invite/
│   └── [token]/page.tsx                      ← MỚI: Trang chấp nhận lời mời
└── api/
    ├── organizations/
    │   ├── route.ts                          ← POST: Tạo tổ chức
    │   └── [orgId]/
    │       ├── route.ts                      ← GET, PUT, DELETE
    │       ├── members/route.ts              ← GET members
    │       ├── invitations/route.ts          ← POST, GET invitations
    │       └── members/[userId]/route.ts     ← PUT, DELETE member
    └── invitations/
        └── [token]/
            ├── accept/route.ts               ← POST: Accept invitation
            └── reject/route.ts               ← POST: Reject invitation
```

---

## 11. Frontend Changes

### 11.1 Organization Context Provider

```typescript
// src/contexts/OrganizationContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  settings: Record<string, any>
  owner_id: string
}

interface OrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  switchOrganization: (orgId: string) => Promise<void>
  refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ 
  children, 
  orgSlug 
}: { 
  children: React.ReactNode
  orgSlug: string 
}) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganization() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch organization by slug (verify user is member)
      const { data: org } = await supabase
        .from('organizations')
        .select(`
          id, name, slug, logo_url, plan, settings, owner_id,
          organization_members!inner(role, status)
        `)
        .eq('slug', orgSlug)
        .eq('organization_members.user_id', user.id)
        .eq('organization_members.status', 'active')
        .single()

      setOrganization(org || null)
      setIsLoading(false)
    }

    fetchOrganization()
  }, [orgSlug])

  return (
    <OrganizationContext.Provider value={{ organization, isLoading, refresh }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
```

### 11.2 Các Component Mới Cần Phát Triển

| Component | Mô Tả |
|-----------|-------|
| `OrganizationSwitcher` | Dropdown chuyển đổi tổ chức (Phase 2) |
| `MemberList` | Danh sách thành viên với role, status, actions |
| `InviteMemberDialog` | Dialog mời thành viên mới (email + role) |
| `InvitationList` | Danh sách lời mời đang chờ |
| `OrganizationSettings` | Settings page cho tổ chức |
| `OrganizationBranding` | Tùy chỉnh logo, màu sắc, tên hiển thị |
| `QuotaUsage` | Hiển thị usage vs limit theo plan |
| `BillingPage` | Quản lý subscription (Phase 2) |
| `AcceptInvitationPage` | Trang chấp nhận lời mời |
| `OnboardingPage` | Trang hướng dẫn tạo/join tổ chức |

### 11.3 Cập Nhật Sidebar Navigation

Sidebar cần hiển thị tên tổ chức hiện tại và cho phép chuyển đổi (nếu thuộc nhiều org):

```
┌─────────────────────────┐
│  🏢 TKV Education Club  │  ← Tên tổ chức (click để switch)
│     tkv-education-club  │  ← Slug
├─────────────────────────┤
│  📊 Dashboard           │
│  👥 Học sinh            │
│  📁 Tài liệu            │
│  📚 Knowledge Base      │
│  💬 AI Chat             │
│  📈 Pipeline            │
│  📉 Analytics           │
├─────────────────────────┤
│  ⚙️ Cài đặt             │
│    ├── Chung            │
│    ├── Thành viên       │  ← MỚI
│    ├── Lời mời          │  ← MỚI
│    └── Gói dịch vụ      │  ← MỚI
├─────────────────────────┤
│  👤 Nguyễn Văn A        │
│     Owner               │
│     [Đăng xuất]         │
└─────────────────────────┘
```

---

## 12. Migration Strategy — Chiến Lược Chuyển Đổi

### 12.1 Phân Tích Ảnh Hưởng Migration

Chuyển đổi từ single-tenant sang multi-tenant là một thay đổi kiến trúc lớn. Chiến lược migration phải đảm bảo không mất dữ liệu hiện tại và không làm gián đoạn hoạt động:

| Bước | Thay Đổi | Rủi Ro | Giảm Thiểu |
|------|----------|--------|-----------|
| 1. Thêm bảng mới | organizations, organization_members, invitations | Thấp | Bảng mới, không ảnh hưởng data hiện tại |
| 2. Thêm cột | `organization_id` vào các bảng hiện tại | Thấp | Cột nullable, thêm DEFAULT cho data cũ |
| 3. Cập nhật RLS | Thêm org filter vào policies | **Cao** | Rollback plan, test kỹ trên staging |
| 4. Cập nhật functions | `search_knowledge_base`, `user_has_permission` | Trung bình | Test từng function |
| 5. Cập nhật Edge Functions | Thêm org awareness | Trung bình | Deploy từng function, test riêng |
| 6. Cập nhật Frontend | Org context, routing, components | Trung bình | Feature flag, gradual rollout |
| 7. Seed data | Tạo org mặc định cho data hiện tại | Thấp | Script migration có rollback |

### 12.2 Migration Script Chi Tiết

```sql
-- ============================================
-- MIGRATION: Single-Tenant → Multi-Tenant
-- File: supabase/migrations/YYYYMMDD_multi_tenant.sql
-- ============================================

-- BẮT ĐẦU TRANSACTION — Rollback nếu có lỗi
BEGIN;

-- ============================================
-- STEP 1: Tạo bảng mới
-- ============================================

-- Tạo enum cho organization member roles
CREATE TYPE org_member_role AS ENUM (
    'owner', 'admin', 'manager', 'counselor', 'processor', 'member'
);

CREATE TYPE org_member_status AS ENUM (
    'pending', 'active', 'suspended', 'left'
);

CREATE TYPE invitation_status AS ENUM (
    'pending', 'accepted', 'rejected', 'expired', 'cancelled'
);

-- Tạo bảng organizations
CREATE TABLE IF NOT EXISTS public.organizations ( ... );  -- Như Section 4.1
CREATE TABLE IF NOT EXISTS public.organization_members ( ... );  -- Như Section 4.2
CREATE TABLE IF NOT EXISTS public.organization_invitations ( ... );  -- Như Section 4.3

-- ============================================
-- STEP 2: Tạo organization mặc định cho data hiện tại
-- ============================================

-- Tạo 1 organization "Ken-AI Default" cho tất cả data hiện có
INSERT INTO public.organizations (id, name, slug, plan, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Ken-AI Default',
    'ken-ai-default',
    'professional',
    true
);

-- ============================================
-- STEP 3: Thêm organization_id vào bảng hiện có
-- ============================================

ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.documents 
    ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.knowledge_base 
    ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.knowledge_categories 
    ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.email_templates 
    ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.pipeline_stages 
    ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

ALTER TABLE public.audit_logs 
    ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES organizations(id);

-- ============================================
-- STEP 4: Gán profiles vào organization mặc định
-- ============================================

-- Tìm user có role cao nhất (admin) → làm owner
-- Nếu không có admin, user đầu tiên làm owner
UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Insert tất cả profiles vào organization_members
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    p.id,
    CASE 
        WHEN p.role = 'admin' THEN 'owner'
        WHEN p.role = 'manager' THEN 'manager'
        WHEN p.role = 'counselor' THEN 'counselor'
        WHEN p.role = 'processor' THEN 'processor'
        ELSE 'member'
    END,
    'active',
    NOW()
FROM public.profiles p
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Cập nhật owner của organization
UPDATE public.organizations 
SET owner_id = (
    SELECT id FROM public.profiles 
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'
      AND role = 'admin'
    LIMIT 1
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Nếu không có admin, lấy user đầu tiên
UPDATE public.organizations 
SET owner_id = (
    SELECT id FROM public.profiles 
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'
    LIMIT 1
)
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND owner_id IS NULL;

-- ============================================
-- STEP 5: Tạo indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_organization ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_base(organization_id);
-- ... (tất cả indexes từ Section 4.6)

-- ============================================
-- STEP 6: Tạo database functions
-- ============================================

-- get_current_organization_id() — Section 4.7
-- require_current_organization_id() — Section 4.7
-- user_has_permission() updated — Section 4.8
-- seed_tenant_data() — Section 7.4

-- ============================================
-- STEP 7: Cập nhật RLS policies
-- ============================================

-- Thực hiện SAU khi đã verify data migration thành công
-- Drop policies cũ và tạo policies mới — Section 5

-- ============================================
-- STEP 8: Cập nhật trigger handle_new_user
-- ============================================

-- Trigger tạo profile mới không cần thay đổi nhiều
-- Nhưng cần thêm logic: khi signup qua invite link, 
-- tự động set organization_id và tạo organization_members record

COMMIT;

-- ============================================
-- ROLLBACK SCRIPT (lưu riêng, chạy nếu cần)
-- ============================================
-- BEGIN;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE students DROP COLUMN IF EXISTS organization_id;
-- ... (drop all organization_id columns)
-- DROP TABLE IF EXISTS public.organization_invitations;
-- DROP TABLE IF EXISTS public.organization_members;
-- DROP TABLE IF EXISTS public.organizations;
-- DROP TYPE IF EXISTS invitation_status;
-- DROP TYPE IF EXISTS org_member_status;
-- DROP TYPE IF EXISTS org_member_role;
-- COMMIT;
```

---

## 13. Roadmap Phát Triển

### Phase 1: Foundation (Tuần 1-3) — **Priority: P0**

Mục tiêu: Thiết lập database multi-tenant và cơ chế cách ly dữ liệu. Đây là phase quan trọng nhất và phải hoàn thành trước khi làm bất kỳ tính năng mới nào.

| Tuần | Task | Priority | Ưu Tiên |
|------|------|----------|---------|
| 1 | Tạo migration script: bảng mới + thêm cột | P0 | Database schema |
| 1 | Viết database functions: `get_current_organization_id()`, v.v. | P0 | DB functions |
| 1 | Tạo organization mặc định + migrate data hiện tại | P0 | Data migration |
| 2 | Cập nhật TẤT CẢ RLS policies thêm org filter | P0 | Security |
| 2 | Cập nhật `search_knowledge_base()` thêm org scope | P0 | AI isolation |
| 2 | Cập nhật `user_has_permission()` check theo org | P0 | RBAC |
| 3 | Test toàn bộ RLS policies (unit test SQL) | P0 | Verification |
| 3 | Cập nhật Edge Functions: thêm org awareness | P0 | AI isolation |
| 3 | Fix: Thay service_role key bằng anon key trong edge functions | P0 | Security fix |

### Phase 2: Registration & Invitation (Tuần 4-5) — **Priority: P1**

Mục tiêu: Cho phép user đăng ký tạo tổ chức mới và mời thành viên.

| Tuần | Task | Priority |
|------|------|----------|
| 4 | Trang đăng ký mới: thêm form org name + slug | P1 |
| 4 | API `POST /api/organizations` — tạo org + seed data | P1 |
| 4 | Update `handle_new_user()` trigger cho multi-tenant | P1 |
| 4 | Cập nhật auth callback: redirect theo org slug | P1 |
| 5 | Trang mời thành viên: `InviteMemberDialog` | P1 |
| 5 | API invitations: create, list, accept, reject | P1 |
| 5 | Gửi email mời qua Supabase | P1 |
| 5 | Trang chấp nhận lời mời: `/invite/[token]` | P1 |
| 5 | Onboarding page cho user chưa có org | P1 |

### Phase 3: Frontend Multi-Tenant (Tuần 6-7) — **Priority: P1**

Mục tiêu: Cập nhật frontend để hoạt động trong context multi-tenant.

| Tuần | Task | Priority |
|------|------|----------|
| 6 | `OrganizationProvider` context | P1 |
| 6 | Cập nhật routing: `/dashboard/[orgSlug]/...` | P1 |
| 6 | Cập nhật middleware: resolve + verify org | P1 |
| 6 | Cập nhật sidebar: hiển thị org name + switcher | P1 |
| 7 | Trang Members: danh sách + đổi role + xóa | P1 |
| 7 | Trang Settings: general + branding + quota | P1 |
| 7 | Tất cả query thêm `organization_id` filter | P1 |
| 7 | Test toàn bộ flows: signup, login, invite, switch | P1 |

### Phase 4: Advanced Features (Tuần 8-10) — **Priority: P2**

Mục tiêu: Tính năng nâng cao cho production.

| Tuần | Task | Priority |
|------|------|----------|
| 8 | Organization switcher cho multi-org users | P2 |
| 8 | Per-org knowledge base seeding templates | P2 |
| 8 | Per-org pipeline customization | P2 |
| 9 | Quota tracking & enforcement | P2 |
| 9 | Usage analytics per organization | P2 |
| 9 | Organization export/import (data portability) | P2 |
| 10 | Subscription plans (Free, Starter, Pro, Enterprise) | P2 |
| 10 | Billing integration (Stripe) | P2 |
| 10 | Admin portal: quản lý tất cả organizations | P2 |

### Phase 5: Performance & Scale (Tuần 11-12) — **Priority: P3**

Mục tiêu: Tối ưu cho production với nhiều tenants.

| Tuần | Task | Priority |
|------|------|----------|
| 11 | Database index optimization cho multi-tenant queries | P3 |
| 11 | Connection pooling (Supavisor) optimization | P3 |
| 11 | Query performance testing với simulated tenants | P3 |
| 12 | Caching layer cho org settings + permissions | P3 |
| 12 | Rate limiting per organization | P3 |
| 12 | Monitoring & alerting per tenant | P3 |

---

## 14. Rủi Ro & Giải Pháp

### 14.1 Ma Trận Rủi Ro

| # | Rủi Ro | Mức Độ | Khả Năng | Giải Pháp |
|---|--------|--------|----------|-----------|
| 1 | **Data leakage giữa tenants** do RLS policy sai | Cao | Thấp | Viết SQL unit tests cho MỖI RLS policy; review bởi DBA; test với 2 tenants khác nhau |
| 2 | **Migration thất bại** làm mất dữ liệu | Cao | Thấp | Transaction wrapping; backup trước migration; rollback script sẵn sàng; test trên staging trước |
| 3 | **Performance giảm** khi thêm org filter vào mọi query | Trung bình | Trung bình | Composite indexes `(organization_id, ...) ` cho mọi bảng; EXPLAIN ANALYZE trước/sau; benchmark với 100+ tenants |
| 4 | **Edge function bypass org isolation** (dùng service_role) | Cao | Trung bình | Đổi tất cả sang anon key + auth header; code review bắt buộc; integration test |
| 5 | **User thuộc nhiều org** gây confusion | Thấp | Trung bình | Phase 1: chỉ hỗ trợ 1 org/user. Phase 4: mới support multi-org với org switcher |
| 6 | **Slug collision** giữa organizations | Thấp | Thấp | UNIQUE constraint trên slug; validation form; suggestion slug from name |
| 7 | **Breaking change** cho API hiện tại | Trung bình | Cao | Version API (v1 → v2); backward compatibility layer; deprecation notice |
| 8 | **Vector search performance** giảm với nhiều tenants | Trung bình | Trung bình | Monitor IVFFlat index quality; re-index định kỳ; cân nhắc HNSW cho dataset lớn |

### 14.2 Testing Strategy

**Database Isolation Tests:**

```sql
-- Test: User A không thể xem data của org B
-- Setup: 2 orgs, 2 users, mỗi org có students riêng
-- Execute: Set JWT cho user A, query students
-- Assert: Chỉ trả về students của org A

-- Test: RLS policy bypass attempt
-- Setup: User A thuộc org A
-- Execute: INSERT INTO students (org_id = org_B.id, ...)  
-- Assert: INSERT fails với permission denied

-- Test: Knowledge base search isolated
-- Setup: 2 orgs, mỗi org có knowledge articles riêng
-- Execute: search_knowledge_base() với JWT của user A
-- Assert: Chỉ trả về articles của org A
```

**Integration Tests:**

```
1. Tạo org mới → Kiểm tra data seed thành công
2. Mời member → Kiểm tra email gửi → Accept → Kiểm tra member list
3. Login → Kiểm tra redirect đúng org slug
4. Query students → Kiểm tra chỉ thấy students của org mình
5. AI chat → Kiểm tra knowledge search chỉ trong org
6. Admin org A xóa member → Kiểm tra member mất access
7. Admin org A thay đổi role member → Kiểm tra permissions update
```

### 14.3 Checklist Trước Khi Production

- [ ] Tất cả RLS policies đã test với 2+ tenants khác nhau
- [ ] Data migration chạy thành công trên staging (không mất data)
- [ ] Rollback script test thành công trên staging
- [ ] Tất cả edge functions dùng anon key (không service_role)
- [ ] `search_knowledge_base()` scoped by organization
- [ ] `conversations_create` enforce `user_id = auth.uid()`
- [ ] Middleware verify org context trên mọi protected route
- [ ] Frontend queries thêm `organization_id` filter
- [ ] Performance benchmark: < 200ms cho queries phổ biến
- [ ] Security audit: không có data leakage giữa tenants
- [ ] Backup strategy cho multi-tenant database
- [ ] Monitoring alerts cho RLS policy violations
- [ ] Documentation cho API changes

---

> **Kết Luận:** Kiến trúc multi-tenant với **Shared-DB + Shared-Schema + Column-Based Isolation** là lựa chọn phù hợp nhất cho Ken-AI ở giai đoạn hiện tại. Việc chuyển đổi yêu cầu ~12 tuần phát triển với 5 phases, nhưng nền tảng RBAC hiện tại và hệ thống RLS policies đã tạo sẵn giúp giảm đáng kể công việc. Ưu tiên cao nhất là **Phase 1 (Foundation)** — hoàn thiện database schema, RLS policies, và edge functions trước khi phát triển thêm tính năng frontend.
