-- SECURITY FIX: Sanitize handle_new_user trigger
-- Remove role extraction from metadata to prevent privilege escalation
-- All new signups default to 'student' role

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with explicit values
  -- SECURITY: Role is ALWAYS 'student' for new signups, never from metadata
  INSERT INTO profiles (id, email, full_name, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    'student'::user_role, -- FIXED: Always default to student, ignore metadata
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION handle_new_user() IS 
  'Automatically creates profile when new user signs up. SECURITY: All new users get student role.';
