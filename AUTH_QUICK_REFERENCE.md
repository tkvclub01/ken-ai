# 🔐 Quick Reference - Auth & RBAC

## 🚀 Quick Commands

### Run Migrations
```sql
-- In Supabase SQL Editor, run these in order:
-- 1. 003_rbac_migration.sql
-- 2. 004_rls_policies.sql
```

### Create Admin User
```sql
-- Update your profile to admin
UPDATE profiles 
SET role = 'admin', email_verified = true
WHERE email = 'your@email.com';
```

### Check Permissions
```sql
-- View permission matrix
SELECT * FROM v_permissions_by_role;

-- Check user's permissions
SELECT get_user_permissions('USER_UUID');

-- Test permission check
SELECT user_has_permission('USER_UUID', 'edit_students');
```

---

## 📝 Code Snippets

### Check Permission
```typescript
import { useAuth } from '@/hooks/useAuth'

const { hasPermission, hasRole } = useAuth()

// Check single permission
if (hasPermission('create_students')) {
  // Show button
}

// Check role
if (hasRole('admin')) {
  // Show admin panel
}

// Check multiple (ANY)
if (hasAnyPermission(['create', 'edit'])) {
  // Has at least one
}

// Check multiple (ALL)
if (hasAllPermissions(['view', 'edit', 'delete'])) {
  // Has all three
}
```

### Protect Component
```typescript
import { PermissionGuard } from '@/components/auth/ProtectedRoute'

// Show only if user has permission
<PermissionGuard permission="delete_students">
  <Button variant="destructive">Delete</Button>
</PermissionGuard>

// Custom fallback
<PermissionGuard 
  permission="edit_students"
  fallback={<p>No edit permission</p>}
>
  <Button>Edit</Button>
</PermissionGuard>
```

### Protect Route/Page
```typescript
import { ProtectedRoute, withProtectedPage } from '@/components/auth/ProtectedRoute'

// Wrapper approach
function Page() {
  return (
    <ProtectedRoute 
      requiredPermissions={['view_analytics']}
      requiredRoles={['admin', 'manager']}
    >
      <AnalyticsDashboard />
    </ProtectedRoute>
  )
}

// HOC approach
function AdminSettings() {
  return <div>Settings</div>
}

export default withProtectedPage(AdminSettings, {
  requiredRoles: ['admin'],
  requiredPermissions: ['manage_settings']
})
```

### Invite User
```typescript
import { inviteUser } from '@/lib/supabase/auth'

const formData = new FormData()
formData.append('email', 'newuser@company.com')
formData.append('fullName', 'John Doe')
formData.append('role', 'counselor')

await inviteUser(formData)
```

### Send Magic Link
```typescript
import { sendMagicLink } from '@/lib/supabase/auth'

await sendMagicLink('user@email.com')
```

### Google OAuth
```typescript
import { signInWithGoogle } from '@/lib/supabase/auth'

const { url } = await signInWithGoogle()
window.location.href = url // Redirect to Google
```

---

## 🎯 Role Capabilities

| Feature | Admin | Manager | Counselor | Processor |
|---------|-------|---------|-----------|-----------|
| All Students | ✅ | ✅ | Assigned Only | Assigned Only |
| Create Student | ✅ | ✅ | ✅ | ❌ |
| Delete Student | ✅ | ✅ | ❌ | ❌ |
| Verify Documents | ✅ | ✅ | ❌ | ✅ |
| Access AI Settings | ✅ | ❌ | ❌ | ❌ |
| Invite Users | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |

---

## 🛠️ Debugging

### Console Checks
```typescript
// In browser console after login
const { user, profile, permissions } = useAuth()

console.log('User:', user)
console.log('Profile:', profile)
console.log('Role:', profile?.role)
console.log('Permissions:', permissions)
```

### Database Checks
```sql
-- Get all permissions for a role
SELECT p.name, p.description, p.category
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role = 'counselor';

-- Check if user exists and role
SELECT email, role, is_active, email_verified
FROM profiles
WHERE email = 'user@email.com';

-- View permission count by role
SELECT role, COUNT(*) as permission_count
FROM role_permissions
GROUP BY role;
```

---

## 🔧 Common Issues

### Issue: Can't access page
**Check:**
1. Is user logged in? → `useAuth().isAuthenticated`
2. Does user have role? → `useAuth().hasRole()`
3. Does user have permission? → `useAuth().hasPermission()`
4. Is RLS blocking? → Check database policies

### Issue: Button not showing
**Check:**
```typescript
// Add debug logging
const { permissions } = useAuth()
console.log('Available permissions:', permissions)
console.log('Has permission:', permissions?.includes('edit_students'))
```

### Issue: Magic Link not working
**Solutions:**
1. Check spam folder
2. Use development mode (check logs)
3. Verify email address is correct
4. Wait for rate limit (3 per hour)

---

## 📋 Default Permissions List

### Students (5)
- `view_students`
- `create_students`
- `edit_students`
- `delete_students`
- `view_all_students`

### Documents (4)
- `view_documents`
- `upload_documents`
- `verify_documents`
- `delete_documents`

### Knowledge (5)
- `view_knowledge`
- `create_knowledge`
- `edit_knowledge`
- `delete_knowledge`
- `access_ai_settings`

### Pipeline (3)
- `view_pipeline`
- `move_pipeline`
- `edit_pipeline`

### Analytics (2)
- `view_analytics`
- `view_financials`

### Users (4)
- `view_users`
- `invite_users`
- `edit_users`
- `delete_users`

### Settings (2)
- `access_settings`
- `manage_settings`

---

## 🔒 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Permissions assigned to roles
- [ ] Middleware protecting routes
- [ ] Frontend using permission guards
- [ ] Audit logging enabled
- [ ] Session management configured
- [ ] Email verification setup (optional)
- [ ] OAuth providers configured (optional)

---

## 📚 Full Documentation

1. **[AUTH_RBAC_GUIDE.md](./AUTH_RBAC_GUIDE.md)** - Complete guide with examples
2. **[QUICKSTART_AUTH.md](./QUICKSTART_AUTH.md)** - Step-by-step setup
3. **[AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)** - Implementation details

---

## ⚡ Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional (for OAuth)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## 🎉 Success Indicators

✅ User can log in  
✅ Permissions load correctly  
✅ Buttons show/hide based on role  
✅ Routes redirect unauthorized users  
✅ Database blocks unauthorized queries  
✅ Audit logs record actions  

---

**Quick Help:** Check `AUTH_RBAC_GUIDE.md` for detailed documentation.
