import Link from 'next/link'
import { getSession } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await getSession()
  
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">KEN AI</h1>
          <p className="mt-2 text-muted-foreground">
            Intelligent Student Management Platform
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-center">Sign In</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          <form className="space-y-4" action={async (formData) => {
            'use server'
            const { signIn } = await import('@/lib/supabase/auth')
            await signIn(formData)
          }}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Don't have an account?
              </span>
            </div>
          </div>

          <Link
            href="/signup"
            className="block w-full py-2 px-4 text-center border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
