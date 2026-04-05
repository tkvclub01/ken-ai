"use client"

import Link from 'next/link'
import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'

function SignUpForm() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [localError, setLocalError] = useState<string | null>(null)
  
  const searchError = searchParams.get('error')
  const displayError = localError || (searchError ? decodeURIComponent(searchError) : null)

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)
    const formData = new FormData(e.currentTarget)
    
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    startTransition(async () => {
      await signUp(formData)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-outfit">KEN AI</h1>
          <p className="mt-2 text-muted-foreground">Join our intelligent student management platform</p>
        </div>
        
        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    type="text" 
                    placeholder="John Doe" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : "Sign Up"}
              </Button>
            </form>
            
            {displayError && (
              <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
                {displayError}
              </div>
            )}
            
            <div className="mt-6 text-center space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign In
                </Link>
              </div>
              
              <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground px-8">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
