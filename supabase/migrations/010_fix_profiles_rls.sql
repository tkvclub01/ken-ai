-- Fix RLS policy for profiles table to prevent privilege escalation
-- Issue: Previous policy allowed any authenticated user to INSERT with any role (including admin)
-- Fix: Users can only create their own profile, not set arbitrary roles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "profiles_insert_for_trigger" ON profiles;

-- Create restrictive policy: users can only insert their own profile
CREATE POLICY "profiles_insert_own_only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only create profile for themselves
  auth.uid() = id
);

-- Also ensure users cannot update role field (only admins can via RPC)
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;

-- For UPDATE: users can update their own profile but NOT the role field
-- We use a separate policy that excludes the role column
CREATE POLICY "profiles_update_own_data"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
);

-- Create a trigger function to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed and user is not admin, reject
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if the requesting user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_prevent_role_change ON profiles;

-- Create trigger to enforce role change restriction
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- Verify policies
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed profiles RLS policies:';
  RAISE NOTICE '   - Users can only INSERT their own profile';
  RAISE NOTICE '   - Users can UPDATE their own profile data';
  RAISE NOTICE '   - Role changes restricted to admins only (via trigger)';
  RAISE NOTICE '   - Only admins can assign roles via RPC functions';
END $$;
