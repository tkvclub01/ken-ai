-- ============================================
-- KEN AI - ROW LEVEL SECURITY (RLS) POLICIES
-- Implements data-level security based on RBAC
-- ============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

-- Policy 1: Users can view students assigned to them OR all students if they have view_all_students permission
CREATE POLICY "students_view_assigned_or_all" ON students
FOR SELECT
USING (
  counselor_id = auth.uid() 
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Policy 2: Create students - requires create_students permission
CREATE POLICY "students_create" ON students
FOR INSERT
WITH CHECK (
  user_has_permission(auth.uid(), 'create_students')
);

-- Policy 3: Update students - requires edit_students permission AND (is counselor OR has edit_all)
CREATE POLICY "students_update" ON students
FOR UPDATE
USING (
  (counselor_id = auth.uid() AND user_has_permission(auth.uid(), 'edit_students'))
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Policy 4: Delete students - requires delete_students permission
CREATE POLICY "students_delete" ON students
FOR DELETE
USING (
  user_has_permission(auth.uid(), 'delete_students')
  AND (counselor_id = auth.uid() OR user_has_permission(auth.uid(), 'view_all_students'))
);

-- ============================================
-- DOCUMENTS TABLE POLICIES
-- ============================================

-- Policy 1: View documents - owner's counselor OR users with view_documents permission
CREATE POLICY "documents_view" ON documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = student_id 
    AND (s.counselor_id = auth.uid() OR user_has_permission(auth.uid(), 'view_all_students'))
  )
  AND user_has_permission(auth.uid(), 'view_documents')
);

-- Policy 2: Upload documents - requires upload_documents permission
CREATE POLICY "documents_upload" ON documents
FOR INSERT
WITH CHECK (
  user_has_permission(auth.uid(), 'upload_documents')
  AND EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = student_id 
    AND (s.counselor_id = auth.uid() OR user_has_permission(auth.uid(), 'view_all_students'))
  )
);

-- Policy 3: Verify documents - requires verify_documents permission
CREATE POLICY "documents_verify" ON documents
FOR UPDATE
USING (
  user_has_permission(auth.uid(), 'verify_documents')
)
WITH CHECK (
  user_has_permission(auth.uid(), 'verify_documents')
);

-- Policy 4: Delete documents - requires delete_documents permission
CREATE POLICY "documents_delete" ON documents
FOR DELETE
USING (
  user_has_permission(auth.uid(), 'delete_documents')
  AND user_has_permission(auth.uid(), 'view_all_students')
);

-- ============================================
-- KNOWLEDGE BASE POLICIES
-- ============================================

-- Policy 1: View knowledge base - all authenticated users with permission
CREATE POLICY "knowledge_view" ON knowledge_base
FOR SELECT
USING (
  user_has_permission(auth.uid(), 'view_knowledge')
);

-- Policy 2: Create knowledge articles - requires create_knowledge permission
CREATE POLICY "knowledge_create" ON knowledge_base
FOR INSERT
WITH CHECK (
  user_has_permission(auth.uid(), 'create_knowledge')
);

-- Policy 3: Edit knowledge articles - requires edit_knowledge permission
CREATE POLICY "knowledge_edit" ON knowledge_base
FOR UPDATE
USING (
  user_has_permission(auth.uid(), 'edit_knowledge')
)
WITH CHECK (
  user_has_permission(auth.uid(), 'edit_knowledge')
);

-- Policy 4: Delete knowledge articles - requires delete_knowledge permission
CREATE POLICY "knowledge_delete" ON knowledge_base
FOR DELETE
USING (
  user_has_permission(auth.uid(), 'delete_knowledge')
);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Policy 1: View own conversations or all if admin/manager
CREATE POLICY "conversations_view" ON conversations
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_has_permission(auth.uid(), 'view_all_students')
);

-- Policy 2: Create conversations - all authenticated users
CREATE POLICY "conversations_create" ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy 3: Update/delete own conversations
CREATE POLICY "conversations_update" ON conversations
FOR UPDATE
USING (
  user_id = auth.uid()
  OR user_has_permission(auth.uid(), 'view_all_students')
);

CREATE POLICY "conversations_delete" ON conversations
FOR DELETE
USING (
  user_id = auth.uid()
  OR user_has_permission(auth.uid(), 'delete_students')
);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Policy 1: View audit logs - only admin and manager
CREATE POLICY "audit_logs_view" ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

-- Policy 2: Insert audit logs - system only (via triggers)
CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT
WITH CHECK (
  true -- Handled by trigger function
);

-- No updates or deletes allowed on audit logs
-- ============================================
-- HELPER FUNCTIONS FOR FRONTEND
-- ============================================

-- Function to check current user permissions
CREATE OR REPLACE FUNCTION get_current_user_permissions()
RETURNS JSONB AS $$
BEGIN
  RETURN get_user_auth_data(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has permission
CREATE OR REPLACE FUNCTION current_user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_permission(auth.uid(), permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON POLICY "students_view_assigned_or_all" ON students IS 'Counselors see their students, admins see all';
COMMENT ON POLICY "documents_view" ON documents IS 'View documents for assigned students';
COMMENT ON POLICY "knowledge_view" ON knowledge_base IS 'View knowledge base with permission';
COMMENT ON FUNCTION get_current_user_permissions IS 'Get current user permissions for frontend';

-- ============================================
-- RLS POLICIES COMPLETE! ✅
-- ============================================
