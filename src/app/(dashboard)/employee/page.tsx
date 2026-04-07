'use client'

import { StatsCards } from '@/components/features/analytics/StatsCards'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng Điều Khiển Nhân Viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý học sinh và xử lý tài liệu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Users className="mr-1 h-4 w-4" />
            Thành Viên Nhóm
          </span>
        </div>
      </div>

      {/* Employee Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hồ Sơ Của Tôi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hồ sơ đang hoạt động dưới sự quản lý của bạn
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tài Liệu Đang Chờ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cần xác minh
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ Lệ Thành Công Visa</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94,5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Năm học này
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhiệm Vụ Đang Chờ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 ưu tiên cao
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Charts & Student Overview */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineChart />
          
          {/* My Students Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>Hồ Sơ Của Tôi</CardTitle>
              <CardDescription>Hồ sơ được phân công cho bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {['NT', 'TH', 'MA', 'LV', 'PC'][i - 1]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Tên Học Sinh {i}</p>
                        <p className="text-xs text-muted-foreground">Giai Đoạn: Nộp Hồ Sơ Trường</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Liên Hệ Lần Cuối</p>
                      <p className="text-sm font-medium">{i * 2} ngày trước</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Document Processing & Activity */}
        <div className="lg:col-span-3 space-y-6">
          <ActivityFeed />
          
          {/* Document Processing Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Hàng Đợi Xử Lý Tài Liệu</CardTitle>
              <CardDescription>Chờ xác minh OCR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Quét Hộ Chiếu</span>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Đang Chờ
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Học sinh: Nguyễn Văn A</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors">
                      Xác Minh
                    </button>
                    <button className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition-colors">
                      Xem Chi Tiết
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao Tác Nhanh</CardTitle>
              <CardDescription>Nhiệm vụ thường gặp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Thêm Học Sinh</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Tải Lên Tài Liệu</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Xác Minh Tài Liệu</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Clock className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Nhiệm Vụ Của Tôi</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
