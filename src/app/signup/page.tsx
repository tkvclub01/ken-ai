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
          <p className="mt-2 text-muted-foreground">Dùng thử miễn phí - Quản lý 2 hồ sơ học sinh</p>
        </div>
        
        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Tạo tài khoản miễn phí</CardTitle>
            <CardDescription>Bắt đầu dùng thử ngay - Không cần thẻ tín dụng</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    type="text" 
                    placeholder="Nguyễn Văn A" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email công ty</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="ban@congty.com" 
                    required 
                    className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
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
                <label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</label>
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
                    Đang tạo tài khoản...
                  </>
                ) : "Đăng ký miễn phí"}
              </Button>
              
              {/* Free Trial Info */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>✨ Gói Starter miễn phí:</strong> Quản lý tối đa 2 hồ sơ học sinh, không giới hạn thời gian sử dụng.
                </p>
              </div>
            </form>
            
            {displayError && (
              <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
                {displayError}
              </div>
            )}
            
            <div className="mt-6 text-center space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Đã có tài khoản? </span>
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Đăng nhập
                </Link>
              </div>
              
              <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground px-8">
          Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
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
