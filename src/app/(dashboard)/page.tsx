'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DashboardRouter() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError)
          router.push('/login')
          return
        }

        const role = profile.role as string

        // Role-based redirect
        if (role === 'admin') {
          router.push('/dashboard/admin')
        } else if (['manager', 'counselor', 'processor'].includes(role)) {
          router.push('/dashboard/employee')
        } else {
          // student or unknown role
          router.push('/dashboard/student')
        }
      } catch (error) {
        console.error('Unexpected error during dashboard routing:', error)
        router.push('/login')
      }
    }

    checkRoleAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
        <p className="text-muted-foreground text-sm">
          Redirecting you to the appropriate view
        </p>
      </div>
    </div>
  )
}
