-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,
  20971520, -- 20MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create helper function to check user role (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION check_user_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  SELECT role::TEXT INTO user_role_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role_val = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies for student-documents bucket

-- Policy 1: Authenticated users can view student documents
CREATE POLICY "Authenticated users can view student documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Users can upload student documents (with permission)
CREATE POLICY "Users can upload student documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated' AND
  check_user_role(ARRAY['admin', 'manager', 'counselor'])
);

-- Policy 3: Users can update student documents
CREATE POLICY "Users can update student documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated' AND
  check_user_role(ARRAY['admin', 'manager', 'counselor'])
);

-- Policy 4: Users can delete student documents
CREATE POLICY "Users can delete student documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated' AND
  check_user_role(ARRAY['admin', 'manager'])
);
