'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAll?: boolean // If true, requires ALL permissions (AND), if false, requires ANY (OR)
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback,
  redirectTo = '/403-unauthorized',
}: ProtectedRouteProps) {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      // Check authentication first
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Check roles
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        router.push(redirectTo)
        return
      }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasAccess = requireAll
          ? hasAllPermissions(requiredPermissions)
          : hasAnyPermission(requiredPermissions)

        if (!hasAccess) {
          router.push(redirectTo)
          return
        }
      }

      setIsAuthorized(true)
      setIsChecking(false)
    }
  }, [
    loading, 
    isAuthenticated, 
    requiredPermissions, 
    requiredRoles, 
    requireAll,
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    router,
    redirectTo
  ])

  if (loading || isChecking) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

// Permission-based wrapper component
interface PermissionGuardProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Role-based wrapper component
interface RoleGuardProps {
  children: React.ReactNode
  roles: string | string[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { hasRole, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!hasRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Higher-order component for page protection
export function withProtectedPage<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    requiredPermissions?: string[]
    requiredRoles?: string[]
    requireAll?: boolean
    redirectTo?: string
  }
) {
  return function ProtectedPage(props: P) {
    return (
      <ProtectedRoute
        requiredPermissions={options?.requiredPermissions}
        requiredRoles={options?.requiredRoles}
        requireAll={options?.requireAll}
        redirectTo={options?.redirectTo}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}
