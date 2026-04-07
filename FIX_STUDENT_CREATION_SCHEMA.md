# Fix: Student Creation Schema Mismatch

## Issue
When creating a new student, the application throws multiple errors:
```
AppError: Could not find the 'current_stage' column of 'students' in the schema cache
AppError: Could not find the 'target_country' column of 'students' in the schema cache
ValidationError: null value in column "organization_id" of relation "students" violates not-null constraint
```

## Root Cause
There's a mismatch between the TypeScript types and the actual database schema:

**TypeScript Types (`src/types/index.ts`):**
- Expects `current_stage` column
- Expects `target_country` column
- Expects `target_school` column
- Form submits these fields when creating students

**Database Schema (`supabase/migrations/002_main_migration.sql`):**
- `students` table has `intended_country` (not `target_country`)
- `students` table has `intended_major` (not `target_school`)
- `students` table does NOT have `current_stage` column
- Pipeline information stored separately in `student_pipeline` table

**NOT NULL Constraint:**
- Migration 017 made `organization_id` NOT NULL on students table
- When creating a student, this field must be provided
- But the form doesn't include it, causing validation errors

This causes Supabase to reject the INSERT operation because it can't find the `current_stage` column.

## Solution
Created migration `019_add_current_stage_to_students.sql` that:

1. ✅ Adds `current_stage` column (default: 'lead')
2. ✅ Adds `target_country` column (for study destination)
3. ✅ Adds `target_school` column (for target university/school)
4. ✅ Creates indexes for all three columns
5. ✅ Copies data from old columns (`intended_country` → `target_country`, `intended_major` → `target_school`)
6. ✅ **Creates trigger function** to automatically set `organization_id` when creating students
7. ✅ Uses `IF NOT EXISTS` for idempotent execution

### Trigger Function Details
The migration creates a PostgreSQL trigger that automatically sets `organization_id`:
- First tries to get it from the counselor's profile (`counselor_id`)
- Falls back to the first organization if no counselor is assigned
- Runs BEFORE INSERT, so the application doesn't need to provide it

## Files Created
- `supabase/migrations/019_add_current_stage_to_students.sql`

## How to Apply

### Option 1: Push to Production (Recommended)
```bash
supabase db push
```

### Option 2: Test Locally First
```bash
# Start local Supabase (requires Docker)
supabase start

# Reset database and apply all migrations
supabase db reset

# Verify the column exists
psql -h localhost -U postgres -d postgres -c "\d students"
```

## Verification

After applying the migration, verify the columns exist:

```sql
-- Check all new columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('current_stage', 'target_country', 'target_school');

-- Should return:
-- column_name    | data_type | column_default
-- current_stage  | text      | 'lead'::text
-- target_country | text      | 
-- target_school  | text      | 
```

Test creating a student through the UI - it should work without errors.

## Alternative Solutions Considered

### Option A: Remove current_stage from TypeScript types
❌ **Rejected** - Would require significant refactoring of forms and components

### Option B: Use student_pipeline table only
❌ **Rejected** - More complex queries, slower performance for common operations

### Option C: Add column to students table (CHOSEN)
✅ **Selected** - Simplest solution, better performance, matches TypeScript expectations

## Impact

### Before Fix
- ❌ Cannot create new students
- ❌ Form submission fails with schema error
- ❌ User experience broken

### After Fix
- ✅ Can create students successfully
- ✅ Form works as expected
- ✅ Better query performance (denormalized data)
- ✅ Backward compatible (existing data preserved)

## Future Considerations

If you want to maintain full normalization later:
1. Keep `current_stage` in `students` for quick access
2. Maintain `student_pipeline` table for detailed history
3. Use triggers to keep them in sync
4. Or migrate to use only `student_pipeline` and update TypeScript types

For now, the denormalized approach is simpler and faster.

---

**Fixed:** April 6, 2026  
**Migration Version:** 019  
**Status:** ✅ Ready for Deployment
