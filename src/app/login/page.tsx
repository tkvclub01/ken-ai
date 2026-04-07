"use client"

import Link from 'next/link'
import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { signIn, sendMagicLink, signInWithGoogle } from '@/lib/supabase/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // Local state for non-transition loading (like OAuth redirect)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  
  const searchError = searchParams.get('error')
  const message = searchParams.get('message')
  
  const displayError = localError || (searchError ? decodeURIComponent(searchError) : null)

  const loading = isPending || isLoading;

  const handlePasswordSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      // In Server Actions, errors are usually handled via redirect or returning state.
      // Since signIn currently redirects on error, it will reload the page with ?error=...
      await signIn(formData)
    })
  }

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setLocalError(null)
    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      await sendMagicLink(email)
      setMagicLinkSent(true)
    } catch (err: any) {
      console.error('Magic link error:', err)
      setLocalError(err.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setLocalError(null)
    try {
      const { url } = await signInWithGoogle()
      if (url) window.location.href = url
    } catch (err: any) {
      console.error('Google sign in error:', err)
      setLocalError(err.message || 'Failed to sign in with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">KEN AI</h1>
          <p className="mt-2 text-muted-foreground">Nền tảng quản lý du học thông minh</p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Chọn phương thức đăng nhập</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Mật khẩu</TabsTrigger>
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
              </TabsList>
              
              <TabsContent value="password" className="space-y-4">
                <form className="space-y-4" onSubmit={handlePasswordSignIn}>
                  <div className="space-y-2">
                    <label htmlFor="email-password" className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email-password" name="email" type="email" autoComplete="email" required className="pl-10" placeholder="ban@congty.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" name="password" type="password" autoComplete="current-password" required className="pl-10" placeholder="••••••••" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Đăng nhập
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="magic" className="space-y-4">
                {magicLinkSent ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 dark:text-green-500">✨ Magic link sent!</div>
                    <p className="text-sm text-muted-foreground">Check your email for the magic link to sign in.</p>
                    <Button variant="outline" onClick={() => setMagicLinkSent(false)} className="w-full">Try another email</Button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email-magic" className="text-sm font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="email-magic" name="email" type="email" autoComplete="email" required className="pl-10" placeholder="ban@congty.com" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Gửi Magic Link
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </Button>
            
            {displayError && (<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{displayError}</div>)}
            {message && (<div className="text-sm text-green-600 dark:text-green-500 bg-green-600/10 p-3 rounded-md">{decodeURIComponent(message)}</div>)}
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Chưa có tài khoản? </span>
              <Link href="/signup" className="font-medium text-primary hover:underline">Tạo tài khoản miễn phí</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
