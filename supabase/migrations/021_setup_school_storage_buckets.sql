-- Migration 021: Setup Supabase Storage buckets for schools
-- Purpose: Create storage buckets for school logos and documents
-- Date: April 6, 2026

BEGIN;

-- Create storage bucket for school logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for school documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-documents', 'school-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for school-logos bucket (public read, admin write)
CREATE POLICY "Public Access for school-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

CREATE POLICY "Admins can upload school logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can update school logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can delete school logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Set up RLS policies for school-documents bucket (authenticated read, admin write)
CREATE POLICY "Authenticated users can view school documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'school-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can upload school documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can update school documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can delete school documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

COMMIT;
