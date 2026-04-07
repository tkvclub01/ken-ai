'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, MessageSquare, FileText, Sparkles, Users, BarChart3, Shield, Zap, Check, Star, Crown, Bot, X, Menu, Mail, Phone, MapPin, Send, Newspaper, Info, HelpCircle, ChevronRight, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const sections = document.querySelectorAll('[id]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  // Calendar Icon Component
  const CalendarIcon = () => (
    <Calendar className="w-4 h-4" />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KEN AI</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Giới thiệu
              </button>
              <button onClick={() => scrollToSection('guides')} className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Hướng dẫn
              </button>
              <button onClick={() => scrollToSection('news')} className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Tin tức
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Liên hệ
              </button>
            </nav>
            
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Đăng ký
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
              <nav className="flex flex-col gap-3">
                <button onClick={() => scrollToSection('about')} className="text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1">
                  Giới thiệu
                </button>
                <button onClick={() => scrollToSection('guides')} className="text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1">
                  Hướng dẫn
                </button>
                <button onClick={() => scrollToSection('news')} className="text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1">
                  Tin tức
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1">
                  Liên hệ
                </button>
                <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1">
                  Đăng nhập
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* System Banner with Animation */}
        <div id="hero" className={`relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 transition-all duration-700 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="relative rounded-[22px] bg-white dark:bg-gray-900 p-8 md:p-12 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Hệ thống quản lý du học thông minh
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  KEN AI
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                    Nền tảng AI thế hệ mới
                  </span>
                </h2>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Tự động hóa quy trình tư vấn du học với trí tuệ nhân tạo tiên tiến.
                  Quản lý hồ sơ, xử lý tài liệu và hỗ trợ khách hàng 24/7.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Dùng thử miễn phí
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all"
                  >
                    Tìm hiểu thêm
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs text-white font-bold">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">500+ trung tâm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">4.9/5</span>
                  </div>
                </div>
              </div>
              
              {/* Right Content - System Visualization */}
              <div className="relative">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  {/* Dashboard Mockup */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">KEN AI Dashboard</div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hồ sơ đang xử lý</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">127</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 12% so với tháng trước</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ thành công</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">94%</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 5% cải thiện</div>
                      </div>
                    </div>
                    
                    {/* Pipeline Visualization */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Pipeline học sinh</div>
                      <div className="space-y-2">
                        {[
                          { stage: 'Lead', count: 45, color: 'bg-blue-500' },
                          { stage: 'Liên hệ', count: 32, color: 'bg-purple-500' },
                          { stage: 'Hồ sơ', count: 28, color: 'bg-pink-500' },
                          { stage: 'Visa', count: 15, color: 'bg-orange-500' },
                          { stage: 'Ghi danh', count: 7, color: 'bg-green-500' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                            <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">{item.stage}</div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Chat Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">KEN AI Assistant</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Đang trực tuyến</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300">
                          Chào bạn! Tôi có thể giúp gì về chương trình du học Úc?
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 text-xs text-blue-900 dark:text-blue-200 ml-8">
                          Yêu cầu visa du học Úc 2024?
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating badges */}
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
                    AI Powered ✨
                  </div>
                  <div className="absolute -bottom-3 -left-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Real-time 🚀
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Trợ lý AI thông minh
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Trả lời tự động các câu hỏi về chương trình du học, yêu cầu visa và quy trình nộp hồ sơ. Hỗ trợ 24/7 với độ chính xác cao.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Cơ sở kiến thức thông minh
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Truy cập cơ sở dữ liệu toàn diện về thông tin du học với tìm kiếm ngữ nghĩa thông minh được hỗ trợ bởi vector embeddings.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Xử lý tài liệu tự động
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Tự động trích xuất và xác minh thông tin từ giấy tờ của học sinh bằng công nghệ OCR tiên tiến. Giảm thời gian xử lý lên đến 80%.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Quản lý pipeline học sinh
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Theo dõi tiến trình từng học sinh qua các giai đoạn: Lead → Liên hệ → Hồ sơ → Visa → Ghi danh. Dashboard trực quan, dễ sử dụng.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Phân tích & Báo cáo
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Thống kê chi tiết về hiệu suất tư vấn, tỷ lệ thành công và xu hướng thị trường. Ra quyết định dựa trên dữ liệu thực tế.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Bảo mật & Phân quyền
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Hệ thống phân quyền RBAC chi tiết (Admin, Manager, Counselor). Mã hóa dữ liệu end-to-end, tuân thủ tiêu chuẩn bảo mật quốc tế.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm md:text-base text-blue-100">Hỗ trợ AI</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">&lt;2s</div>
              <div className="text-sm md:text-base text-blue-100">Thời gian phản hồi</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">95%+</div>
              <div className="text-sm md:text-base text-blue-100">Độ chính xác</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">80%</div>
              <div className="text-sm md:text-base text-blue-100">Giảm thời gian xử lý</div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Gói dịch vụ linh hoạt
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Chọn gói phù hợp với quy mô trung tâm của bạn. Giá theo số lượng hồ sơ quản lý.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Free Trial Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  Dùng thử miễn phí
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gói Starter</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Dành cho cá nhân hoặc trung tâm nhỏ mới bắt đầu</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">0đ</span>
                  <span className="text-gray-600 dark:text-gray-400">/tháng</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Miễn phí mãi mãi</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Quản lý tối đa <strong>2 hồ sơ học sinh</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Trợ lý AI cơ bản</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Pipeline quản lý đơn giản</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Hỗ trợ qua email</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg text-center transition-colors text-sm"
              >
                Bắt đầu dùng thử miễn phí
              </Link>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Không cần thẻ tín dụng • Setup trong 2 phút
              </p>
            </div>

            {/* Standard Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden hover:shadow-3xl transition-all hover:-translate-y-1">
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  Phổ biến nhất
                </div>
              </div>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium mb-4">
                  <Crown className="w-4 h-4" />
                  Gói chuyên nghiệp
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">Gói Standard</h4>
                <p className="text-blue-100 text-sm">Dành cho trung tâm tư vấn du học đang phát triển</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">1.500.000đ</span>
                </div>
                <p className="text-sm text-blue-100 mt-2">15 hồ sơ x 100.000đ/hồ sơ</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Quản lý tối đa <strong>15 hồ sơ học sinh</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Trợ lý AI nâng cao với KEN AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Tìm kiếm ngữ nghĩa thông minh</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Xử lý tài liệu tự động (OCR)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Phân tích & báo cáo chi tiết</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">Lưu trữ hồ sơ vĩnh viễn</span>
                </li>
              </ul>

              <Link
                href="/signup?plan=standard"
                className="block w-full py-3 px-6 bg-white hover:bg-gray-50 text-blue-600 font-bold rounded-lg text-center transition-colors shadow-lg text-sm"
              >
                Đăng ký ngay - Dùng thử 14 ngày
              </Link>
              <p className="text-xs text-center text-blue-100 mt-3">
                Dùng thử đầy đủ tính năng • Hủy bất cứ lúc nào
              </p>
            </div>

            {/* Professional Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-purple-300 dark:border-purple-700 p-6 hover:shadow-2xl transition-all hover:-translate-y-1 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="px-4 py-1 bg-purple-600 text-white rounded-full text-sm font-bold shadow-lg">
                  Tiết kiệm 11%
                </div>
              </div>

              <div className="mb-6 mt-2">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gói Professional</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Dành cho trung tâm có nhiều nhân viên</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">2.670.000đ</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">30 hồ sơ x 89.000đ/hồ sơ</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Tất cả tính năng Standard +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Quản lý tối đa <strong>30 hồ sơ/tháng</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Phân quyền nhân viên (Admin, Manager, Counselor)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Hỗ trợ ưu tiên 24/7</span>
                </li>
              </ul>

              <Link
                href="/signup?plan=professional"
                className="block w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors text-sm"
              >
                Chọn gói Professional
              </Link>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Tiết kiệm 330.000đ/tháng so với Standard
              </p>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-orange-300 dark:border-orange-700 p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
                  <Users className="w-4 h-4" />
                  Doanh nghiệp
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gói Enterprise</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Dành cho tập đoàn và chuỗi trung tâm</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">6.320.000đ</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">80 hồ sơ x 79.000đ/hồ sơ</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Tất cả tính năng Professional +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Quản lý tối đa <strong>80 hồ sơ/tháng</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Hỗ trợ tập đoàn chuyên biệt</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">SLA cam kết uptime 99.9%</span>
                </li>
              </ul>

              <Link
                href="/signup?plan=enterprise"
                className="block w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-center transition-colors text-sm"
              >
                Chọn gói Enterprise
              </Link>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Tiết kiệm 1.680.000đ/tháng so với Professional
              </p>
            </div>

            {/* Custom Enterprise Plan */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-2xl shadow-2xl p-6 text-white hover:shadow-3xl transition-all hover:-translate-y-1">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium mb-4">
                  <Shield className="w-4 h-4" />
                  Tùy chỉnh
                </div>
                <h4 className="text-2xl font-bold mb-2">Gói Tập Đoàn</h4>
                <p className="text-gray-300 text-sm">Giải pháp toàn diện cho doanh nghiệp lớn</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">Liên hệ</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">Giá theo nhu cầu thực tế</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Không giới hạn hoặc tùy chỉnh số hồ sơ</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Tất cả tính năng Enterprise +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">API tùy chỉnh & tích hợp hệ thống</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Đào tạo nhân sự tận nơi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Account Manager riêng</span>
                </li>
              </ul>

              <a
                href="mailto:sales@kenai.vn"
                className="block w-full py-3 px-6 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg text-center transition-colors text-sm"
              >
                Liên hệ tư vấn
              </a>
              <p className="text-xs text-center text-gray-300 mt-3">
                Giải pháp tùy chỉnh theo yêu cầu
              </p>
            </div>
          </div>

          {/* Price per profile breakdown */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                💡 So sánh giá theo từng hồ sơ
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Starter</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0đ</p>
                  <p className="text-xs text-gray-500">/hồ sơ</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">100.000đ</p>
                  <p className="text-xs text-gray-500">/hồ sơ</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Professional</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">89.000đ</p>
                  <p className="text-xs text-gray-500">/hồ sơ • Tiết kiệm 11%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">79.000đ</p>
                  <p className="text-xs text-gray-500">/hồ sơ • Tiết kiệm 21%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Testimonials Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Đánh giá từ khách hàng
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hàng trăm trung tâm tư vấn du học đã tin tưởng sử dụng KEN-AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "KEN-AI đã giúp chúng tôi tiết kiệm 70% thời gian xử lý hồ sơ. Trợ lý AI trả lời chính xác 95% câu hỏi của học sinh, giảm đáng kể khối lượng công việc cho đội ngũ tư vấn."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  NT
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Nguyễn Thị Lan</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Giám đốc - EduPath Consulting</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "Tính năng OCR tự động trích xuất thông tin từ giấy tờ thật ấn tượng. Chúng tôi xử lý được gấp 3 lần số lượng hồ sơ so với trước đây mà không cần thêm nhân sự."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                  TM
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Trần Minh Đức</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Quản lý - Global Study Abroad</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "Giao diện dễ sử dụng, pipeline quản lý trực quan. Nhân viên mới chỉ cần 1 ngày để làm quen. Hỗ trợ kỹ thuật rất nhiệt tình và phản hồi nhanh chóng."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold">
                  LH
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Lê Hoàng Mai</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tư vấn viên - VisaPro Center</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Dashboard Preview Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Giao diện chuyên nghiệp
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Thiết kế hiện đại, trực quan, tối ưu cho trải nghiệm người dùng
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-300 dark:border-gray-700 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              {/* Dashboard Mockup */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Window Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">KEN-AI Dashboard</div>
                  <div className="w-16"></div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Tổng hồ sơ', value: '1,247', change: '+12%', color: 'blue' },
                      { label: 'Đang xử lý', value: '127', change: '+8%', color: 'purple' },
                      { label: 'Hoàn thành', value: '892', change: '+15%', color: 'green' },
                      { label: 'Tỷ lệ thành công', value: '94%', change: '+3%', color: 'orange' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                        <div className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ {stat.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline & Chart Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Pipeline */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline học sinh</div>
                      <div className="space-y-3">
                        {[
                          { stage: 'Lead', count: 45, width: '100%', color: 'bg-blue-500' },
                          { stage: 'Liên hệ', count: 32, width: '71%', color: 'bg-purple-500' },
                          { stage: 'Hồ sơ', count: 28, width: '62%', color: 'bg-pink-500' },
                          { stage: 'Visa', count: 15, width: '33%', color: 'bg-orange-500' },
                          { stage: 'Ghi danh', count: 7, width: '16%', color: 'bg-green-500' }
                        ].map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">{item.stage}</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: item.width }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hoạt động gần đây</div>
                      <div className="space-y-3">
                        {[
                          { action: 'Hồ sơ mới được tạo', time: '2 phút trước', icon: '📄' },
                          { action: 'Visa đã được phê duyệt', time: '15 phút trước', icon: '✅' },
                          { action: 'AI trả lời câu hỏi', time: '1 giờ trước', icon: '🤖' },
                          { action: 'Tài liệu OCR hoàn tất', time: '2 giờ trước', icon: '📝' }
                        ].map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="text-lg">{activity.icon}</div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-900 dark:text-white">{activity.action}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sẵn sàng bắt đầu?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng trăm trung tâm tư vấn du học đang sử dụng KEN-AI để tăng năng suất và nâng cao chất lượng dịch vụ.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Đăng ký ngay - Miễn phí
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Dùng thử miễn phí 2 hồ sơ • Không cần thẻ tín dụng • Setup trong 2 phút
          </p>
        </div>

        {/* Section 1: About Us (Giới thiệu) */}
        <section id="about" className={`mt-32 transition-all duration-700 ${visibleSections.has('about') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
              <Info className="w-4 h-4" />
              Về chúng tôi
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Giới thiệu về KEN AI
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nền tảng quản lý du học thông minh hàng đầu Việt Nam
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-16">
            {/* Company Introduction */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sứ mệnh của chúng tôi</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                KEN AI là nền tảng quản lý du học thông minh được xây dựng với sứ mệnh cách mạng hóa ngành tư vấn du học tại Việt Nam. 
                Chúng tôi kết hợp trí tuệ nhân tạo tiên tiến, công nghệ OCR hiện đại và quy trình làm việc tối ưu để giúp các trung tâm 
                tư vấn du học tiết kiệm thời gian, nâng cao hiệu quả và mang đến trải nghiệm tốt nhất cho học sinh.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Với hơn 500+ trung tâm đang tin tưởng sử dụng, KEN AI đã xử lý thành công hàng chục nghìn hồ sơ du học, 
                giúp giảm 70% thời gian xử lý thủ công và tăng tỷ lệ thành công lên 94%.
              </p>
            </div>

            {/* Founder Profile */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold">TT</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">Thành Tân</h4>
                    <p className="text-blue-100 font-medium mb-4">Chief Technology Officer (CTO)</p>
                    <p className="text-blue-50 leading-relaxed">
                      Với hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ và AI, Thành Tân dẫn dắt đội ngũ kỹ thuật 
                      phát triển các giải pháp đột phá cho ngành giáo dục. Tầm nhìn của anh là xây dựng hệ thống 
                      tự động hóa toàn diện, giúp mọi trung tâm tư vấn du học đều có thể tiếp cận công nghệ AI tiên tiến.
                    </p>
                  </div>
                </div>
              </div>

              {/* Corporate Culture */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Văn hóa doanh nghiệp</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Đổi mới sáng tạo</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Luôn tìm kiếm và áp dụng công nghệ mới nhất</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Khách hàng là trung tâm</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mọi quyết định đều vì lợi ích khách hàng</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Chính trực & Minh bạch</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cam kết đạo đức nghề nghiệp cao nhất</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vision & Strengths */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Tầm nhìn & Thế mạnh cốt lõi</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white mb-2">Công nghệ AI tiên tiến</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trợ lý AI với độ chính xác 95%, hỗ trợ 24/7</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white mb-2">OCR chính xác cao</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tự động trích xuất thông tin từ giấy tờ với độ chính xác 98%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white mb-2">Bảo mật dữ liệu</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mã hóa end-to-end, tuân thủ tiêu chuẩn quốc tế</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: User Guides (Hướng dẫn) */}
        <section id="guides" className={`mt-32 transition-all duration-700 ${visibleSections.has('guides') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Tài liệu hướng dẫn
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Hướng dẫn sử dụng
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Khám phá các tính năng mạnh mẽ của KEN AI qua hướng dẫn chi tiết
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Guide Card 1 */}
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quản lý học sinh</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Hướng dẫn tạo, cập nhật và theo dõi hồ sơ học sinh qua từng giai đoạn pipeline
                </p>
                <button className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Xem hướng dẫn <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guide Card 2 */}
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <FileText className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xử lý tài liệu OCR</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Tự động trích xuất thông tin từ hộ chiếu, bảng điểm, chứng chỉ với độ chính xác cao
                </p>
                <button className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Xem hướng dẫn <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guide Card 3 */}
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <MessageSquare className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Trợ lý AI</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Cấu hình và sử dụng trợ lý AI để trả lời tự động câu hỏi của học sinh 24/7
                </p>
                <button className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Xem hướng dẫn <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guide Card 4 */}
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <BarChart3 className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Báo cáo phân tích</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Tạo báo cáo chi tiết về hiệu suất tư vấn, tỷ lệ thành công và xu hướng thị trường
                </p>
                <button className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Xem hướng dẫn <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Latest News (Tin tức) */}
        <section id="news" className={`mt-32 transition-all duration-700 ${visibleSections.has('news') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
              <Newspaper className="w-4 h-4" />
              Tin tức mới
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tin tức & Cập nhật
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Những tin tức mới nhất về EdTech và cập nhật sản phẩm KEN AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* News Item 1 */}
            <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white/80" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <CalendarIcon />
                  <span>15 Tháng 1, 2026</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  KEN AI ra mắt tính năng OCR đa ngôn ngữ hỗ trợ 10+ ngôn ngữ
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Công nghệ OCR mới của KEN AI giờ đây có thể xử lý tài liệu bằng tiếng Anh, Trung, Hàn, Nhật và nhiều ngôn ngữ khác với độ chính xác lên đến 98%...
                </p>
                <button className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm hover:gap-3 transition-all">
                  Đọc thêm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>

            {/* News Item 2 */}
            <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="w-16 h-16 text-white/80" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <CalendarIcon />
                  <span>10 Tháng 1, 2026</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  Báo cáo: Ngành EdTech Việt Nam tăng trưởng 45% trong năm 2025
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Theo nghiên cứu mới nhất, thị trường công nghệ giáo dục Việt Nam đạt mức tăng trưởng ấn tượng, với AI và automation đóng vai trò then chốt...
                </p>
                <button className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm hover:gap-3 transition-all">
                  Đọc thêm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>

            {/* News Item 3 */}
            <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Users className="w-16 h-16 text-white/80" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <CalendarIcon />
                  <span>5 Tháng 1, 2026</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  KEN AI vượt mốc 500+ trung tâm tư vấn du học tin tưởng sử dụng
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Chỉ sau 6 tháng ra mắt, KEN AI đã trở thành lựa chọn hàng đầu của hơn 500 trung tâm tư vấn du học trên toàn quốc...
                </p>
                <button className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm hover:gap-3 transition-all">
                  Đọc thêm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* Section 4: Contact (Liên hệ) */}
        <section id="contact" className={`mt-32 mb-20 transition-all duration-700 ${visibleSections.has('contact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              Liên hệ
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Gửi tin nhắn</h4>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung tin nhắn
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                  Gửi tin nhắn
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <h4 className="text-xl font-bold mb-6">Thông tin liên hệ</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Email</div>
                      <a href="mailto:support@kenai.id.vn" className="text-blue-100 hover:text-white transition-colors">
                        support@kenai.id.vn
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Điện thoại</div>
                      <a href="tel:+84941419617" className="text-blue-100 hover:text-white transition-colors">
                        0941419617
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Địa chỉ</div>
                      <p className="text-blue-100">
                        Phường Hoà Bình<br />
                        Thành Phố Hải Phòng<br />
                        Việt Nam
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Giờ làm việc</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Thứ 2 - Thứ 6</span>
                    <span className="font-medium text-gray-900 dark:text-white">8:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Thứ 7</span>
                    <span className="font-medium text-gray-900 dark:text-white">9:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Chủ nhật</span>
                    <span className="font-medium text-red-600 dark:text-red-400">Nghỉ</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      * Hỗ trợ AI tự động hoạt động 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating AI Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="mb-4 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">KEN-AI Assistant</div>
                  <div className="text-xs text-blue-100">Đang trực tuyến</div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Xin chào! Tôi là KEN-AI. Tôi có thể giúp gì cho bạn?
                </div>
              </div>
            </div>

            {/* Quick Reply Buttons */}
            <div className="px-4 pb-4 space-y-2">
              <button className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 transition-colors">
                💰 Xem bảng giá
              </button>
              <button className="w-full text-left px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300 transition-colors">
                📝 Tính năng OCR
              </button>
              <button className="w-full text-left px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-300 transition-colors">
                🔧 Hỗ trợ kỹ thuật
              </button>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">KEN AI</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Nền tảng quản lý du học thông minh hàng đầu Việt Nam
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Sản phẩm</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Tính năng
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Bảng giá
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('guides')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Hướng dẫn
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Công ty</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('about')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Giới thiệu
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('news')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Tin tức
                  </button>
                </li>
                <li>
                  <Link href="/signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Tuyển dụng
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Hỗ trợ</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('contact')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Liên hệ
                  </button>
                </li>
                <li>
                  <a href="mailto:support@kenai.vn" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Email hỗ trợ
                  </a>
                </li>
                <li>
                  <a href="tel:+84123456789" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Hotline
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>© 2026 KEN-AI. Intelligent Student Management Platform.</p>
              <p className="text-sm mt-2">
                KEN-AI
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
