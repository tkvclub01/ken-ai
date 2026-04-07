-- Migration 020: Add school notes column and email templates for schools
-- Purpose: Add internal notes field to schools table and create school-specific email templates
-- Date: April 6, 2026

BEGIN;

-- Add notes column to schools table for internal partnership notes
ALTER TABLE public.schools 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create school_email_templates table for school-specific communication templates
CREATE TABLE IF NOT EXISTS public.school_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category VARCHAR(100), -- e.g., 'partnership', 'admissions', 'visa_support'
  variables TEXT[], -- Template variables like {{school_name}}, {{contact_person}}
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for school_email_templates
ALTER TABLE public.school_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.school_email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins and managers" ON public.school_email_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Enable update for admins and managers" ON public.school_email_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Enable delete for admins and managers" ON public.school_email_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_email_templates_school_id ON public.school_email_templates(school_id);
CREATE INDEX IF NOT EXISTS idx_school_email_templates_category ON public.school_email_templates(category);
CREATE INDEX IF NOT EXISTS idx_school_email_templates_active ON public.school_email_templates(is_active);

-- Add trigger for updated_at on school_email_templates
CREATE TRIGGER trigger_update_school_email_templates_updated_at
BEFORE UPDATE ON public.school_email_templates
FOR EACH ROW
EXECUTE FUNCTION update_schools_updated_at();

COMMIT;
