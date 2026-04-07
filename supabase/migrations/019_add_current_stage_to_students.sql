-- Migration 019: Fix students table schema to match TypeScript types
-- Purpose: Add missing columns that TypeScript types expect but DB doesn't have
-- Date: April 6, 2026

BEGIN;

-- Add current_stage column (for pipeline tracking)
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'lead';

-- Add target_country column (alias for intended_country)
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS target_country TEXT;

-- Add target_school column (similar to intended_major but for school name)
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS target_school TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_current_stage ON students(current_stage);
CREATE INDEX IF NOT EXISTS idx_students_target_country ON students(target_country);
CREATE INDEX IF NOT EXISTS idx_students_target_school ON students(target_school);

-- Update existing students to have default stage if they don't have one
UPDATE public.students 
SET current_stage = 'lead' 
WHERE current_stage IS NULL;

-- Copy data from old column names to new ones if they exist
-- This ensures backward compatibility
DO $$
BEGIN
  -- Copy intended_country to target_country if intended_country exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'intended_country') THEN
    UPDATE public.students 
    SET target_country = intended_country 
    WHERE target_country IS NULL AND intended_country IS NOT NULL;
  END IF;
  
  -- Copy intended_major to target_school if intended_major exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'intended_major') THEN
    UPDATE public.students 
    SET target_school = intended_major 
    WHERE target_school IS NULL AND intended_major IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- FIX: Set default organization_id for students
-- ============================================
-- The organization_id column is NOT NULL, so we need to ensure it's set automatically
-- We'll create a trigger function that sets organization_id based on the counselor_id

CREATE OR REPLACE FUNCTION set_student_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If organization_id is not provided, get it from the counselor's profile
  IF NEW.organization_id IS NULL AND NEW.counselor_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.counselor_id;
  END IF;
  
  -- If still NULL, use the first organization as fallback
  IF NEW.organization_id IS NULL THEN
    SELECT id INTO NEW.organization_id
    FROM organizations
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_set_student_organization ON students;
CREATE TRIGGER trg_set_student_organization
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION set_student_organization_id();

-- Add comments
COMMENT ON COLUMN students.current_stage IS 'Current pipeline stage for the student (lead, contact, application, visa, enrolled)';
COMMENT ON COLUMN students.target_country IS 'Target country for study abroad';
COMMENT ON COLUMN students.target_school IS 'Target school/university name';
COMMENT ON FUNCTION set_student_organization_id() IS 'Automatically sets organization_id for new students based on counselor or defaults to first org';

COMMIT;
