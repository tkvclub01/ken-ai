"use client"

import Link from 'next/link'
import { useState, useTransition, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, Loader2, ArrowLeft, Sparkles, Check, ArrowRight } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'

function SignUpForm() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [localError, setLocalError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  // Entry animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
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
          <p className="text-lg text-gray-600 dark:text-gray-300">Dùng thử miễn phí - Quản lý 2 hồ sơ học sinh</p>
        </div>
        
        {/* Signup Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>
          
          <Card className="shadow-none border-0 bg-transparent">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Tạo tài khoản miễn phí</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Bắt đầu dùng thử ngay - Không cần thẻ tín dụng</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      required 
                      className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email công ty</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="ban@congty.com" 
                      required 
                      className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
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
                      placeholder="••••••••" 
                      required 
                      className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Xác nhận mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      Đăng ký miễn phí
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {/* Free Trial Info */}
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Gói Starter miễn phí:</strong> Quản lý tối đa 2 hồ sơ học sinh, không giới hạn thời gian sử dụng.
                    </p>
                  </div>
                </div>
              </form>
              
              {displayError && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                  {displayError}
                </div>
              )}
              
              <div className="mt-6 text-center space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Đã có tài khoản? </span>
                  <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                    Đăng nhập
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                
                <Link href="/login" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 px-8">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Điều khoản dịch vụ
          </Link>
          {' '}và{' '}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Chính sách bảo mật
          </Link>
          {' '}của chúng tôi.
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
