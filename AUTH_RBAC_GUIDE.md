# 🔐 Authentication & Authorization Guide - KEN AI

This guide explains the complete RBAC (Role-Based Access Control) system implemented in KEN AI.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [Role System](#role-system)
4. [Permission System](#permission-system)
5. [Database Security (RLS)](#database-security)
6. [Frontend Protection](#frontend-protection)
7. [User Management](#user-management)
8. [Examples](#examples)

---

## Overview

KEN AI uses **Supabase Auth** with a custom RBAC system that provides:

- ✅ Multiple authentication methods (Email/Password, Magic Link, OAuth)
- ✅ Role-based access control (Admin, Manager, Counselor, Processor)
- ✅ Permission-based authorization (granular permissions)
- ✅ Row-level security (RLS) at database level
- ✅ Frontend route protection
- ✅ UI element visibility based on permissions

---

## Authentication Methods

### 1. Email/Password (Traditional)

```typescript
import { signIn } from '@/lib/supabase/auth'

// In your form action
<form action={signIn}>
  <input name="email" type="email" />
  <input name="password" type="password" />
  <button type="submit">Sign In</button>
</form>
```

### 2. Magic Link (Passwordless)

```typescript
import { sendMagicLink } from '@/lib/supabase/auth'

const handleMagicLink = async (email: string) => {
  await sendMagicLink(email)
  // User receives email with magic link
}
```

**Benefits:**
- No password to remember
- Enhanced security (one-time use)
- Prevents credential stuffing attacks

### 3. Google OAuth (Recommended for Companies)

```typescript
import { signInWithGoogle } from '@/lib/supabase/auth'

const handleGoogleSignIn = async () => {
  const { url } = await signInWithGoogle()
  window.location.href = url // Redirects to Google
}
```

**Setup Required:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials
4. Set authorized redirect URLs

---

## Role System

### Available Roles

| Role | Description | Use Case |
|------|-------------|----------|
| `admin` | Full system access | IT Administrator, System Owner |
| `manager` | Most operations except user management | Office Manager, Senior Counselor |
| `counselor` | Student and document management | Student Counselors, Advisors |
| `processor` | Document processing only | Document Processing Staff |

### Role Assignment

Roles are assigned when:
1. **Inviting users**: Admin selects role during invitation
2. **Manual update**: Directly in Supabase or via User Management page

---

## Permission System

### Permission Categories

#### Students
- `view_students` - View assigned students
- `create_students` - Create new student records
- `edit_students` - Edit student information
- `delete_students` - Delete student records
- `view_all_students` - View ALL students (not just assigned)

#### Documents
- `view_documents` - View documents
- `upload_documents` - Upload new documents
- `verify_documents` - Verify OCR results
- `delete_documents` - Delete documents

#### Knowledge Base
- `view_knowledge` - View knowledge articles
- `create_knowledge` - Create articles
- `edit_knowledge` - Edit articles
- `delete_knowledge` - Delete articles
- `access_ai_settings` - Configure AI settings

#### Pipeline
- `view_pipeline` - View student pipeline
- `move_pipeline` - Move students between stages
- `edit_pipeline` - Edit pipeline configuration

#### Analytics
- `view_analytics` - View analytics dashboard
- `view_financials` - View financial data

#### User Management
- `view_users` - View user list
- `invite_users` - Invite new users
- `edit_users` - Edit user roles
- `delete_users` - Delete user accounts

#### Settings
- `access_settings` - Access general settings
- `manage_settings` - Manage system settings

### Default Permission Matrix

| Permission | Admin | Manager | Counselor | Processor |
|------------|-------|---------|-----------|-----------|
| view_students | ✅ | ✅ | ✅ | ✅ |
| create_students | ✅ | ✅ | ✅ | ❌ |
| edit_students | ✅ | ✅ | ✅ | ❌ |
| delete_students | ✅ | ✅ | ❌ | ❌ |
| view_all_students | ✅ | ✅ | ❌ | ❌ |
| upload_documents | ✅ | ✅ | ✅ | ✅ |
| verify_documents | ✅ | ✅ | ❌ | ✅ |
| access_ai_settings | ✅ | ❌ | ❌ | ❌ |
| invite_users | ✅ | ❌ | ❌ | ❌ |
| manage_settings | ✅ | ❌ | ❌ | ❌ |

---

## Database Security (RLS)

### What is RLS?

Row-Level Security (RLS) ensures users can only access data they're authorized to see, enforced at the database level.

### Example Policies

**Students Table:**
```sql
-- Counselors see only their assigned students
CREATE POLICY "students_view_assigned_or_all" ON students
FOR SELECT USING (
  counselor_id = auth.uid() 
  OR user_has_permission(auth.uid(), 'view_all_students')
);
```

**Documents Table:**
```sql
-- Only counselors of the student can view documents
CREATE POLICY "documents_view" ON documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = student_id 
    AND (s.counselor_id = auth.uid() OR user_has_permission(auth.uid(), 'view_all_students'))
  )
  AND user_has_permission(auth.uid(), 'view_documents')
);
```

### How It Works

1. User makes a query through Supabase client
2. PostgreSQL checks RLS policies
3. Database function `user_has_permission()` verifies permissions
4. Only authorized rows are returned

**Result:** Even if someone bypasses frontend checks, the database still protects the data!

---

## Frontend Protection

### 1. Using Hooks

```typescript
'use client'
import { useAuth } from '@/hooks/useAuth'

export function MyComponent() {
  const { hasPermission, hasRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      {hasPermission('create_students') && (
        <Button>Create Student</Button>
      )}
      
      {hasRole('admin') && (
        <Button>Admin Panel</Button>
      )}
    </div>
  )
}
```

### 2. ProtectedRoute Component

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export function Dashboard() {
  return (
    <ProtectedRoute
      requiredPermissions={['view_analytics']}
      requiredRoles={['admin', 'manager']}
    >
      <AnalyticsDashboard />
    </ProtectedRoute>
  )
}
```

**Props:**
- `requiredPermissions`: Array of permission names
- `requiredRoles`: Array of allowed roles
- `requireAll`: If true, requires ALL permissions (AND), otherwise ANY (OR)
- `fallback`: Custom loading/fallback UI
- `redirectTo`: Where to redirect if unauthorized (default: `/403-unauthorized`)

### 3. PermissionGuard Component

```typescript
import { PermissionGuard } from '@/components/auth/ProtectedRoute'

export function StudentActions() {
  return (
    <div>
      <PermissionGuard permission="edit_students">
        <Button>Edit Student</Button>
      </PermissionGuard>
      
      <PermissionGuard permission="delete_students">
        <Button variant="destructive">Delete Student</Button>
      </PermissionGuard>
    </div>
  )
}
```

### 4. Higher-Order Component

```typescript
import { withProtectedPage } from '@/components/auth/ProtectedRoute'

function AdminSettings() {
  return <div>Admin Settings Page</div>
}

export default withProtectedPage(AdminSettings, {
  requiredRoles: ['admin'],
  requiredPermissions: ['manage_settings']
})
```

### 5. Middleware Protection

The middleware automatically:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login`
- Enforces role-based route access
- Redirects unauthorized access to `/403-unauthorized`

**Protected Routes:**
- `/dashboard`
- `/students`
- `/documents`
- `/knowledge`
- `/analytics`
- `/chat`
- `/settings`

**Role-Based Access:**
```typescript
// Processors cannot access /analytics
const roleRouteAccess = {
  processor: ['/', '/students', '/documents', '/knowledge', '/chat']
  // ...other roles
}
```

---

## User Management

### Inviting Users (Admin Only)

1. Navigate to **Settings → Users**
2. Click **"Invite User"**
3. Fill in:
   - Full Name
   - Email
   - Role (Admin, Manager, Counselor, Processor)
4. Click **"Send Invitation"**

**What happens:**
- System sends email invitation
- User clicks link to set up account
- First login requires password setup
- User appears in team list

### Programmatic Invitation

```typescript
import { inviteUser } from '@/lib/supabase/auth'

const formData = new FormData()
formData.append('email', 'newuser@example.com')
formData.append('fullName', 'John Doe')
formData.append('role', 'counselor')

await inviteUser(formData)
```

---

## Examples

### Example 1: Show Button Based on Permission

```typescript
import { useAuth } from '@/hooks/useAuth'
import { PermissionGuard } from '@/components/auth/ProtectedRoute'

export function StudentCard({ student }: { student: Student }) {
  const { hasPermission } = useAuth()

  return (
    <Card>
      <CardContent>
        <h3>{student.full_name}</h3>
        
        {/* Only show edit button if user has permission */}
        <PermissionGuard permission="edit_students">
          <Button>Edit</Button>
        </PermissionGuard>
        
        {/* Only show delete button for admins/managers */}
        <PermissionGuard permission="delete_students">
          <Button variant="destructive">Delete</Button>
        </PermissionGuard>
      </CardContent>
    </Card>
  )
}
```

### Example 2: Protect API Route

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const hasPermission = await supabase.rpc('user_has_permission', {
    user_id: user.id,
    permission_name: 'view_financials'
  })
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Return data
  return NextResponse.json({ data: 'sensitive financial info' })
}
```

### Example 3: Conditional Menu Items

```typescript
import { useAuth } from '@/hooks/useAuth'

export function Sidebar() {
  const { hasPermission, hasRole } = useAuth()

  return (
    <nav>
      <MenuItem href="/students">Students</MenuItem>
      <MenuItem href="/documents">Documents</MenuItem>
      
      {/* Only show for counselors and above */}
      {hasRole(['admin', 'manager', 'counselor']) && (
        <MenuItem href="/analytics">Analytics</MenuItem>
      )}
      
      {/* Only show for admins */}
      {hasRole('admin') && (
        <MenuItem href="/settings/users">User Management</MenuItem>
      )}
      
      {/* Only show if user has AI settings permission */}
      {hasPermission('access_ai_settings') && (
        <MenuItem href="/settings/ai">AI Configuration</MenuItem>
      )}
    </nav>
  )
}
```

### Example 4: Bulk Operations with Permission Check

```typescript
import { useAuth } from '@/hooks/useAuth'

export function StudentTable({ students }: { students: Student[] }) {
  const { hasPermission } = useAuth()

  const handleBulkDelete = async () => {
    if (!hasPermission('delete_students')) {
      alert('You do not have permission to delete students')
      return
    }
    
    // Perform bulk delete
  }

  return (
    <Table>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.id}>
            <TableCell>{student.full_name}</TableCell>
            <TableCell>
              {hasPermission('edit_students') && (
                <Button size="sm">Edit</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {hasPermission('delete_students') && (
        <Button onClick={handleBulkDelete}>Delete Selected</Button>
      )}
    </Table>
  )
}
```

---

## Testing Your Setup

### 1. Create Test Users

```sql
-- Run in Supabase SQL Editor
-- Create test users with different roles
INSERT INTO auth.users (email, email_confirmed_at) 
VALUES 
  ('admin@test.com', NOW()),
  ('manager@test.com', NOW()),
  ('counselor@test.com', NOW()),
  ('processor@test.com', NOW());

-- Assign roles (get the UUIDs from above insert)
-- Then check permissions work correctly
```

### 2. Test Permission Checks

```typescript
// In browser console after logging in as different users
const { hasPermission, hasRole } = useAuth()

console.log('Has edit_students?', hasPermission('edit_students'))
console.log('Is admin?', hasRole('admin'))
```

### 3. Test RLS Policies

```sql
-- Login as different users in Supabase Studio
-- Try to access other user's students
-- Should be blocked by RLS
```

---

## Security Best Practices

1. **Always check permissions on both frontend AND backend**
   - Frontend: For UX (hide/show UI elements)
   - Backend: For security (enforce access control)

2. **Use RLS for all sensitive tables**
   - Database-level enforcement
   - Cannot be bypassed

3. **Principle of Least Privilege**
   - Give minimum necessary permissions
   - Regular permission audits

4. **Audit Logs**
   - All actions are logged in `audit_logs` table
   - Review logs regularly

5. **Session Management**
   - Sessions auto-expire
   - Implement proper logout

---

## Troubleshooting

### Issue: User can't access page

**Check:**
1. Is user authenticated? → Check session
2. Does user have required role? → Check `profiles.role`
3. Does user have required permission? → Check `role_permissions`
4. Is RLS blocking access? → Check database policies

### Issue: Permission not working

**Debug:**
```typescript
const { permissions, profile } = useAuth()
console.log('User role:', profile?.role)
console.log('User permissions:', permissions)
```

Then check database:
```sql
SELECT * FROM v_permissions_by_role 
WHERE role = 'counselor';
```

### Issue: Magic Link not sending

**Check:**
1. Supabase email configuration
2. Email in spam folder
3. Rate limiting (max 3 per hour)

---

## Migration Steps

To implement this system in your existing project:

1. **Run Migrations:**
   ```bash
   # In Supabase Studio, run:
   # 1. 003_rbac_migration.sql
   # 2. 004_rls_policies.sql
   ```

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Configure OAuth (Optional):**
   - Set up Google OAuth in Supabase Dashboard

4. **Test Locally:**
   - Create admin user
   - Invite test users with different roles
   - Verify permissions work correctly

---

## Support

For questions or issues:
- Check this documentation
- Review Supabase docs: https://supabase.com/docs
- Check migration files for SQL details

---

**Last Updated:** April 4, 2026  
**Version:** 1.0.0
