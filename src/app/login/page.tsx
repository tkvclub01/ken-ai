"use client"

import Link from 'next/link'
import { useState, useTransition, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { signIn, sendMagicLink, signInWithGoogle } from '@/lib/supabase/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // Local state for non-transition loading (like OAuth redirect)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  // Entry animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className={`w-full max-w-md space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">KEN AI</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Nền tảng quản lý du học thông minh</p>
        </div>
        
        {/* Login Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>
          
          <Card className="shadow-none border-0 bg-transparent">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Đăng nhập</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Chọn phương thức đăng nhập</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="password" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all">Mật khẩu</TabsTrigger>
                  <TabsTrigger value="magic" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all">Magic Link</TabsTrigger>
                </TabsList>
              
                <TabsContent value="password" className="space-y-4 mt-4">
                  <form className="space-y-4" onSubmit={handlePasswordSignIn}>
                    <div className="space-y-2">
                      <label htmlFor="email-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          id="email-password" 
                          name="email" 
                          type="email" 
                          autoComplete="email" 
                          required 
                          className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                          placeholder="ban@congty.com" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          id="password" 
                          name="password" 
                          type="password" 
                          autoComplete="current-password" 
                          required 
                          className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                          placeholder="••••••••" 
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Đăng nhập
                    </Button>
                  </form>
                </TabsContent>
              
                <TabsContent value="magic" className="space-y-4 mt-4">
                  {magicLinkSent ? (
                    <div className="text-center space-y-4">
                      <div className="text-green-600 dark:text-green-500 font-semibold">✨ Magic link sent!</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Check your email for the magic link to sign in.</p>
                      <Button variant="outline" onClick={() => setMagicLinkSent(false)} className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Try another email</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email-magic" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                          <Input 
                            id="email-magic" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            required 
                            className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                            placeholder="ban@congty.com" 
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Gửi Magic Link
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Hoặc tiếp tục với</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                onClick={handleGoogleSignIn} 
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
              </Button>
              
              {displayError && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                  {displayError}
                </div>
              )}
              {message && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                  {decodeURIComponent(message)}
                </div>
              )}
              
              <div className="text-center text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Chưa có tài khoản? </span>
                <Link href="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                  Tạo tài khoản miễn phí
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
