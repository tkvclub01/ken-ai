import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/students',
  '/documents',
  '/knowledge',
  '/analytics',
  '/chat',
  '/settings'
]

// Public routes (login, signup, etc.)
const publicRoutes = ['/login', '/signup']

// Role-based route access mapping
const roleRouteAccess: Record<string, string[]> = {
  admin: ['/', '/students', '/documents', '/knowledge', '/analytics', '/chat', '/settings'],
  manager: ['/', '/students', '/documents', '/knowledge', '/analytics', '/chat', '/settings'],
  counselor: ['/', '/students', '/documents', '/knowledge', '/analytics', '/chat'],
  processor: ['/', '/students', '/documents', '/knowledge', '/chat']
}

export default async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token and get user
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access login/signup, redirect to dashboard
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based access control for specific routes
  if (user && isProtectedRoute) {
    try {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const userRole = profile.role as string
        const allowedRoutes = roleRouteAccess[userRole] || []
        
        // Check if user's role has access to this route
        const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))
        
        if (!hasAccess) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL('/403-unauthorized', request.url))
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // Continue with default behavior if role check fails
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
