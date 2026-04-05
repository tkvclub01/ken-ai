import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/auth/callback', '/403-unauthorized', '/404']

// Role-based route access mapping
// Note: '/' is allowed for all roles as it auto-redirects based on role
const roleRouteAccess: Record<string, string[]> = {
  admin: ['/', '/dashboard', '/settings', '/students', '/documents', '/knowledge', '/analytics', '/chat'],
  manager: ['/', '/dashboard', '/students', '/documents', '/knowledge', '/analytics', '/chat'],
  counselor: ['/', '/dashboard', '/students', '/documents', '/knowledge', '/analytics', '/chat'],
  processor: ['/', '/dashboard', '/documents', '/knowledge', '/chat'],
  student: ['/', '/dashboard', '/documents', '/knowledge']
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // FIX: Set all cookies on the response ONCE, not in nested loops
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (!user && !isPublicRoute) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based access control for protected routes
  if (user && !isPublicRoute) {
    try {
      // Get user profile to check role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        // FAIL CLOSED: If we can't verify role, deny access
        console.error('Middleware: Failed to fetch user profile:', error)
        return NextResponse.redirect(new URL('/403-unauthorized', request.url))
      }

      const userRole = profile.role as string
      
      // Store role in response header for client-side use
      supabaseResponse.headers.set('x-user-role', userRole)
      
      // Check if user's role has access to this route
      const allowedRoutes = roleRouteAccess[userRole] || []
      const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))
      
      if (!hasAccess) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/403-unauthorized', request.url))
      }
    } catch (error) {
      // FAIL CLOSED: On any error, deny access instead of allowing through
      console.error('Middleware: Role check failed - denying access:', error)
      return NextResponse.redirect(new URL('/403-unauthorized', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
