-- Secure password change RPC function
-- Requires current password verification before allowing change

CREATE OR REPLACE FUNCTION change_user_password(
  current_password TEXT,
  new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with definer's privileges (postgres)
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  email_address TEXT;
BEGIN
  -- Get current user ID from auth context
  user_id := auth.uid();
  
  -- Verify user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;
  
  -- Get user's email
  SELECT email INTO email_address
  FROM auth.users
  WHERE id = user_id;
  
  -- Verify current password by attempting authentication
  -- This uses Supabase's built-in password verification
  PERFORM 1 FROM auth.users 
  WHERE id = user_id 
  AND encrypted_password = crypt(current_password, encrypted_password);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current password is incorrect' USING ERRCODE = 'P0002';
  END IF;
  
  -- Validate new password strength
  IF LENGTH(new_password) < 8 THEN
    RAISE EXCEPTION 'New password must be at least 8 characters' USING ERRCODE = 'P0003';
  END IF;
  
  -- Update password using Supabase auth API
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Log the password change in audit_logs
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    user_id,
    'password_changed',
    'user',
    user_id::TEXT,
    jsonb_build_object('changed_at', NOW())
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with safe message (don't expose internal errors)
    IF SQLSTATE IN ('P0001', 'P0002', 'P0003') THEN
      RAISE;
    ELSE
      RAISE EXCEPTION 'Failed to update password' USING ERRCODE = 'P0004';
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_user_password(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION change_user_password IS 
  'Securely changes user password after verifying current password. Requires authentication.';
