-- ============================================
-- KEN AI - RBAC (ROLE-BASED ACCESS CONTROL) MIGRATION
-- This creates a proper permission-based system
-- ============================================

-- STEP 1: Create Permissions Table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'students', 'documents', 'knowledge', 'settings', 'users'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Create Role-Permissions Junction Table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- STEP 3: Add metadata to profiles for better tracking
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- STEP 4: Insert Default Permissions
INSERT INTO permissions (name, description, category) VALUES
-- Student Permissions
('view_students', 'View student list and details', 'students'),
('create_students', 'Create new student records', 'students'),
('edit_students', 'Edit existing student records', 'students'),
('delete_students', 'Delete student records', 'students'),
('view_all_students', 'View all students (not just assigned)', 'students'),

-- Document Permissions
('view_documents', 'View documents', 'documents'),
('upload_documents', 'Upload new documents', 'documents'),
('verify_documents', 'Verify OCR results', 'documents'),
('delete_documents', 'Delete documents', 'documents'),

-- Knowledge Base Permissions
('view_knowledge', 'View knowledge base articles', 'knowledge'),
('create_knowledge', 'Create knowledge base articles', 'knowledge'),
('edit_knowledge', 'Edit knowledge base articles', 'knowledge'),
('delete_knowledge', 'Delete knowledge base articles', 'knowledge'),
('access_ai_settings', 'Configure AI settings', 'knowledge'),

-- Pipeline Permissions
('view_pipeline', 'View student pipeline', 'pipeline'),
('move_pipeline', 'Move students in pipeline', 'pipeline'),
('edit_pipeline', 'Edit pipeline stages', 'pipeline'),

-- Analytics Permissions
('view_analytics', 'View analytics dashboard', 'analytics'),
('view_financials', 'View financial data', 'analytics'),

-- User Management Permissions
('view_users', 'View user list', 'users'),
('invite_users', 'Invite new users', 'users'),
('edit_users', 'Edit user roles and details', 'users'),
('delete_users', 'Delete user accounts', 'users'),

-- Settings Permissions
('access_settings', 'Access general settings', 'settings'),
('manage_settings', 'Manage system settings', 'settings');

-- STEP 5: Assign Permissions to Roles

-- Admin: All permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Manager: Most permissions except user management and settings
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions 
WHERE name NOT IN (
  'invite_users', 'delete_users', 'manage_settings', 'access_ai_settings'
);

-- Counselor: Student and document focused
INSERT INTO role_permissions (role, permission_id)
SELECT 'counselor', id FROM permissions 
WHERE name IN (
  'view_students', 'create_students', 'edit_students',
  'view_documents', 'upload_documents',
  'view_knowledge', 'view_pipeline', 'move_pipeline',
  'view_analytics'
);

-- Processor: Document processing focused
INSERT INTO role_permissions (role, permission_id)
SELECT 'processor', id FROM permissions 
WHERE name IN (
  'view_students',
  'view_documents', 'upload_documents', 'verify_documents',
  'view_knowledge', 'view_pipeline'
);

-- STEP 6: Create Helper Functions

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  has_perm BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO user_role_val 
  FROM profiles 
  WHERE id = user_id;
  
  -- Check if role has the permission
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role_val
    AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
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

-- Function to get user's role and permissions
CREATE OR REPLACE FUNCTION get_user_auth_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role_val user_role;
  perms TEXT[];
BEGIN
  -- Get user's role
  SELECT role INTO user_role_val 
  FROM profiles 
  WHERE id = user_id;
  
  -- Get permissions
  perms := get_user_permissions(user_id);
  
  RETURN jsonb_build_object(
    'role', user_role_val,
    'permissions', perms
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Create Indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- STEP 8: Update handle_new_user function to set email_verified
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

-- STEP 9: Create Views for Easy Access

-- View of all permissions by role
CREATE VIEW v_permissions_by_role AS
SELECT 
  rp.role,
  p.name AS permission_name,
  p.description,
  p.category
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.category, p.name;

-- View of user details with auth info
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

COMMENT ON TABLE permissions IS 'List of all system permissions';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON FUNCTION user_has_permission IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
COMMENT ON VIEW v_permissions_by_role IS 'Complete permission matrix by role';

-- ============================================
-- RBAC MIGRATION COMPLETE! ✅
-- ============================================
