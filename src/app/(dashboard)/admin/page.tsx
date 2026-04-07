'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/features/analytics/StatsCards'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { AISummaryWidget } from '@/components/features/analytics/AISummaryWidget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Settings, Shield, DollarSign, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // Fetch real user count
  const { data: userCount, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return count || 0
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch active students count
  const { data: studentCount, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-student-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return count || 0
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with gradient accent */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 shadow-xl">
        <div className="relative rounded-[14px] bg-white dark:bg-gray-900 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Bảng Điều Khiển Quản Trị
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản trị hệ thống và quản lý người dùng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
                <Shield className="mr-1.5 h-4 w-4" />
                Quản Trị Viên
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Tổng Người Dùng</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {userCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Người dùng hệ thống
            </p>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Hồ Sơ Đang Hoạt Động</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {studentCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Tổng số học sinh
            </p>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Doanh Thu (Hàng Tháng)</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              $45,231
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
              ↑ +20.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Sức Khỏe Hệ Thống</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              98.2%
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
              Tất cả hệ thống hoạt động bình thường
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid with enhanced spacing */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Charts & Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineChart />
          <AISummaryWidget />
          
          {/* Admin-Specific: Financial Overview */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Tổng Quan Tài Chính</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Theo dõi doanh thu và chi phí hàng tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <p className="text-muted-foreground text-sm font-medium">
                  Biểu đồ doanh thu sẽ được triển khai tại đây
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Admin Management */}
        <div className="lg:col-span-3 space-y-6">
          <ActivityFeed />
          
          {/* User Management Quick Access */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Quản Lý Nhân Viên</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Truy cập nhanh vào các công cụ quản lý người dùng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => router.push('/settings/users')}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Tất Cả Nhân Viên</span>
                </button>
                <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Vai Trò</span>
                </button>
                <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-green-50 hover:to-cyan-50 dark:hover:from-green-900/20 dark:hover:to-cyan-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Cài Đặt</span>
                </button>
                <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Nhật Ký Kiểm Toán</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Trạng Thái Hệ Thống</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Sức khỏe và chỉ số hệ thống hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cơ Sở Dữ Liệu</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Trực Tuyến
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dịch Vụ AI</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Hoạt Động
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ Nhớ</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Đã Sử Dụng 78%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
