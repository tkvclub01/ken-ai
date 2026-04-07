# Migration 018 Fix - Table Name Correction

## Issue
The migration file `supabase/migrations/018_knowledge_base_analytics.sql` was referencing a non-existent table `public.knowledge_articles`, causing the error:

```
ERROR: 42P01: relation "public.knowledge_articles" does not exist
```

## Root Cause
The actual table name in the database schema is `knowledge_base`, not `knowledge_articles`. This was confirmed by checking:
- `supabase/migrations/002_main_migration.sql` (line 96) - Creates `knowledge_base` table
- `supabase/migrations/016_add_organization_columns.sql` - References `knowledge_base`
- All other migrations use `knowledge_base`

## Fix Applied
Replaced all occurrences of `public.knowledge_articles` with `public.knowledge_base` in the following locations:

### 1. Foreign Key Constraints (Lines 11, 31)
```sql
-- Before
article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE

-- After
article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE
```

### 2. JOIN Clauses in RPC Functions (Lines 215, 253, 286)
```sql
-- Before
LEFT JOIN public.knowledge_articles ka ON ...
FROM public.knowledge_articles ka ...

-- After
LEFT JOIN public.knowledge_base ka ON ...
FROM public.knowledge_base ka ...
```

## Files Modified
- ✅ `supabase/migrations/018_knowledge_base_analytics.sql`

## Verification
```bash
# Verify no more references to knowledge_articles
grep -n "knowledge_articles" supabase/migrations/018_knowledge_base_analytics.sql
# Should return nothing (exit code 1)
```

## Next Steps
You can now safely apply this migration:

```bash
# Option 1: Push to production
supabase db push

# Option 2: Test locally first (requires Docker)
supabase start
supabase db reset
supabase db push
```

## Tables Created by This Migration
1. **article_views** - Tracks article view events with search queries and time spent
2. **article_feedback** - Stores helpful/not helpful user feedback

## RPC Functions Created
1. `track_article_view()` - Record article views
2. `record_article_feedback()` - Store user feedback
3. `get_article_usage_stats()` - Get comprehensive usage statistics
4. `identify_content_gaps()` - Find unanswered search queries
5. `get_low_rated_articles()` - Identify articles needing improvement
6. `get_failed_search_queries()` - Track failed searches

All functions now correctly reference the `knowledge_base` table.

---

**Fixed:** April 6, 2026  
**Migration Version:** 018  
**Status:** ✅ Ready for Deployment
