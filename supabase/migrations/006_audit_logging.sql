-- ============================================
-- KEN AI - AUDIT LOGGING FOR USER MANAGEMENT
-- Enables audit logging for employee management actions
-- ============================================

-- Update audit_logs RLS policy to allow admin inserts
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

-- ============================================
-- AUDIT LOGGING MIGRATION COMPLETE! ✅
-- ============================================
