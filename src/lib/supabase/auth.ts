'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[Auth] Attempting sign in for:', email)

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Auth] Sign in failed:', error.message)
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  console.log('[Auth] Sign in successful, fetching user profile...')

  // Get user role and update last login
  if (data.user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError.message)
      } else {
        // Update last login time
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id)

        const role = profile?.role || 'counselor'

        // Role-based redirect
        let redirectPath = '/'
        if (role === 'admin') {
          redirectPath = '/admin'
        } else if (['manager', 'counselor', 'processor'].includes(role)) {
          redirectPath = '/employee'
        } else {
          // student or unknown role
          redirectPath = '/student'
        }

        revalidatePath('/', 'layout')
        redirect(redirectPath)
      }
    } catch (err: any) {
      // Re-throw Next.js redirect errors to allow proper redirection
      if (err.message && err.message.includes('NEXT_REDIRECT')) {
        throw err
      }
      console.error('Unexpected error during login role check:', err)
      // Fallback to default redirect
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string || ''

  console.log(`Attempting signup for: ${email}`)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: fullName,
          role: 'counselor', // Explicitly set role for trigger enum safety
        },
      },
    })

    if (error) {
      console.error('Supabase Auth error during signup:', error.message, error.status)
      redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    console.log('Signup successful, user created:', data.user?.id)
    
    // Note: Profile will be automatically created by database trigger (handle_new_user)
    // No need to verify here as RLS may block immediate read by new user
    
    revalidatePath('/', 'layout')
    redirect('/login?message=Check your email to confirm your account')
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) {
      throw err; // Re-throw Next.js redirects
    }
    console.error('Unexpected error during signup action:', err)
    redirect(`/signup?error=${encodeURIComponent(err.message || 'An unexpected error occurred during signup.')}`)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Magic Link Authentication
export async function sendMagicLink(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

// OAuth Authentication (Google)
export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { url: data.url }
}

// Invite User (Admin only)
export async function inviteUser(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const fullName = formData.get('fullName') as string

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can invite users')
  }

  // Send invite email
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: role,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/settings/users')
  return { success: true }
}
