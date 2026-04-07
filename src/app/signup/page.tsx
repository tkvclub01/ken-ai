"use client"

import Link from 'next/link'
import { useState, useTransition, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, Loader2, ArrowLeft, Sparkles, Check, ArrowRight, Calendar as CalendarIcon, Phone } from 'lucide-react'
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
          <p className="text-lg text-gray-600 dark:text-gray-300">Hệ thống quản lý du học thông minh</p>
        </div>
        
        {/* Professional Notice Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>
          
          <Card className="shadow-none border-0 bg-transparent">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Thông báo quan trọng</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">Vui lòng đọc kỹ thông tin bên dưới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Message */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    20/04/2026
                  </div>
                  <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    Hệ thống sẽ chính thức phát hành vào ngày<br />
                    <span className="text-blue-600 dark:text-blue-400">20 tháng 04 năm 2026</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                    Vui lòng quay lại sau để trải nghiệm những tính năng tuyệt vời của KEN AI
                  </p>
                </div>
              </div>

              {/* Features Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center">Những gì bạn sẽ nhận được:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">AI trợ lý thông minh 24/7</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">Xử lý tài liệu OCR tự động</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">Quản lý pipeline trực quan</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">Báo cáo phân tích chi tiết</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-3">
                  Bạn có thắc mắc? Liên hệ với chúng tôi:
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <a href="mailto:support@kenai.id.vn" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                  <span className="text-gray-400">•</span>
                  <a href="tel:+84941419617" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    <Phone className="w-4 h-4" />
                    Hotline
                  </a>
                </div>
              </div>

              {/* Back to Home */}
              <div className="pt-2">
                <Link href="/" className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại trang chủ
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 px-8">
          © 2026 KEN AI. Nền tảng quản lý du học thông minh hàng đầu Việt Nam.
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
