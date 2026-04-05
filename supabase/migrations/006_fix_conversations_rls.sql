-- Fix conversations_create RLS policy to enforce user_id ownership
-- This prevents users from creating conversations for other users

DROP POLICY IF EXISTS "conversations_create" ON conversations;

CREATE POLICY "conversations_create" ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

COMMENT ON POLICY "conversations_create" ON conversations IS 
  'Users can only create conversations for themselves. Prevents privilege escalation.';
