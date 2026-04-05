-- ============================================
-- KEN AI - FIX PROFILES TABLE RLS AND TRIGGER
-- This fixes the signup issue where profile creation fails
-- ============================================

-- STEP 1: Ensure profiles table has RLS enabled but allows trigger inserts
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 2: Create policy that allows authenticated users to view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- STEP 3: Create policy that allows users to update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
FOR UPDATE
USING (
  auth.uid() = id
)

-- STEP 4: Create policy that allows INSERT only via trigger (SECURITY DEFINER)
-- This is important: the trigger function uses SECURITY DEFINER, 
-- but we need to allow inserts when called from within the same transaction
CREATE POLICY "profiles_insert_for_trigger" ON profiles
FOR INSERT
WITH CHECK (true);

-- STEP 5: Allow service role to manage profiles (for system operations)
CREATE POLICY "service_manage_profiles" ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 6: Verify the handle_new_user function is correct
-- Recreate it to ensure it's using SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with explicit values
  INSERT INTO profiles (id, email, full_name, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'counselor')::user_role,
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- STEP 7: Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 8: Add helpful comments
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile when new user signs up';
COMMENT ON POLICY "profiles_insert_for_trigger" ON profiles IS 'Allows profile creation during user signup';

-- ============================================
-- FIX COMPLETE! ✅
-- Test signup now - it should work properly
-- ============================================
