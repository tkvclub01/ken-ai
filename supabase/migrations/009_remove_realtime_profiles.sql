-- Remove realtime subscription from profiles table
-- We're using React Query caching instead of Supabase Realtime

-- Check if profiles is in the publication before removing
DO $$
BEGIN
  -- Only drop if table exists in publication
  IF EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
    RAISE NOTICE '✅ Removed profiles from realtime publication';
  ELSE
    RAISE NOTICE ' Profiles was not in realtime publication (already removed or never added)';
  END IF;
END $$;

-- Verify final state
DO $$
DECLARE
  is_in_publication BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'profiles'
  ) INTO is_in_publication;
  
  IF is_in_publication THEN
    RAISE NOTICE '❌ WARNING: profiles is still in realtime publication!';
  ELSE
    RAISE NOTICE '✅ Confirmed: profiles removed from realtime publication';
    RAISE NOTICE '📊 Using React Query caching instead (10 min staleTime)';
  END IF;
END $$;
