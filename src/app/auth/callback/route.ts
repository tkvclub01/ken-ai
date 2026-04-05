import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Get user profile to determine role
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profile not found or not accessible:', profileError?.message)
        // Profile might not exist yet - this shouldn't happen with trigger but handle gracefully
        // Redirect to login with message
        return NextResponse.redirect(
          new URL('/login?error=Profile+not+found.+Please+contact+support.', requestUrl.origin)
        )
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)

      // Role-based redirect
      const role = profile.role as string
      let redirectTo = '/'
      
      if (role === 'admin') {
        redirectTo = '/dashboard/admin'
      } else if (['manager', 'counselor', 'processor'].includes(role)) {
        redirectTo = '/dashboard/employee'
      } else {
        // student or unknown role
        redirectTo = '/dashboard/student'
      }

      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
