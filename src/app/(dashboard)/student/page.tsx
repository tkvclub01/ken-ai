'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileCheck, GraduationCap, MessageCircle } from 'lucide-react'

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cổng Thông Tin Hồ Sơ</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi hành trình du học của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
            <GraduationCap className="mr-1 h-4 w-4" />
            Hồ Sơ Học Sinh
          </span>
        </div>
      </div>

      {/* Profile Stats Cards - Personal Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng Thái Hồ Sơ</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Đang Xử Lý</div>
            <p className="text-xs text-muted-foreground mt-1">
              Giai đoạn nộp hồ sơ trường
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tài Liệu</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8/12</div>
            <p className="text-xs text-muted-foreground mt-1">
              4 tài liệu đang chờ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hạn Chót Tiếp Theo</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Tháng 12</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nộp đơn đại học
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giáo Viên Tư Vấn</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Cô Lan Anh</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sẵn sàng trò chuyện
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - My Pipeline & Documents */}
        <div className="lg:col-span-4 space-y-6">
          {/* My Application Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Hồ Sơ Ứng Tuyển Của Tôi</CardTitle>
              <CardDescription>Theo dõi tiến độ qua từng giai đoạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pipeline Stages */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  {/* Stage Items */}
                  {[
                    { name: 'Tư Vấn', status: 'completed', date: '1 Tháng 11, 2024', icon: MessageCircle },
                    { name: 'Thu Thập Tài Liệu', status: 'completed', date: '15 Tháng 11, 2024', icon: FileCheck },
                    { name: 'Nộp Hồ Sơ Trường', status: 'current', date: 'Đang Thực Hiện', icon: BookOpen },
                    { name: 'Xin Visa', status: 'pending', date: 'Dự Kiến: Tháng 1/2025', icon: FileCheck },
                    { name: 'Chuẩn Bị Khởi Hành', status: 'pending', date: 'Dự Kiến: Tháng 2/2025', icon: GraduationCap },
                  ].map((stage, index) => (
                    <div key={stage.name} className="relative flex items-start gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 ${
                        stage.status === 'completed' 
                          ? 'border-green-500 bg-green-500/10 text-green-600' 
                          : stage.status === 'current'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted text-muted-foreground'
                      }`}>
                        <stage.icon className="h-6 w-6" />
                        <span className="text-xs font-medium mt-0.5">{index + 1}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <h4 className={`font-semibold ${
                          stage.status === 'current' ? 'text-primary' : ''
                        }`}>
                          {stage.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{stage.date}</p>
                        {stage.status === 'current' && (
                          <p className="text-xs text-primary mt-1">● Đang Thực Hiện</p>
                        )}
                        {stage.status === 'completed' && (
                          <p className="text-xs text-green-600 mt-1">✓ Hoàn Thành</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Tài Liệu Của Tôi</CardTitle>
              <CardDescription>Tải lên và theo dõi tài liệu của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Bản Sao Hộ Chiếu', status: 'verified', date: 'Đã tải lên 10 Tháng 11' },
                  { name: 'Bảng Điểm Học Tập', status: 'verified', date: 'Đã tải lên 12 Tháng 11' },
                  { name: 'Chứng Chỉ Tiếng Anh', status: 'pending', date: 'Đã tải lên 20 Tháng 11' },
                  { name: 'Thư Giới Thiệu 1', status: 'required', date: 'Chưa tải lên' },
                  { name: 'Thư Giới Thiệu 2', status: 'required', date: 'Chưa tải lên' },
                  { name: 'Bài Luận Cá Nhân', status: 'required', date: 'Chưa tải lên' },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileCheck className={`h-5 w-5 ${
                        doc.status === 'verified' 
                          ? 'text-green-600' 
                          : doc.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-muted-foreground'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === 'verified'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : doc.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {doc.status === 'verified' ? '✓ Đã Xác Minh' : doc.status === 'pending' ? '⏳ Đang Chờ' : '⚠ Yêu Cầu'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-primary hover:underline">
                Xem Tất Cả Tài Liệu →
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Resources & Support */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao Tác Nhanh</CardTitle>
              <CardDescription>Bạn muốn làm gì?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <FileCheck className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Tải Lên Tài Liệu</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Trò Chuyện Với AI</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Cơ Sở Kiến Thức</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Hồ Sơ Của Tôi</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base - Limited Access */}
          <Card>
            <CardHeader>
              <CardTitle>Tài Nguyên Hữu Ích</CardTitle>
              <CardDescription>Hướng dẫn và thông tin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Cách Xin Visa Du Học', category: 'Hướng Dẫn Visa' },
                { title: 'Chuẩn Bị Cho Kỳ Thi IELTS', category: 'Yêu Cầu Tiếng Anh' },
                { title: 'Các Lựa Chọn Nhà Ở Nước Ngoài', category: 'Sống Ở Nước Ngoài' },
              ].map((article) => (
                <div key={article.title} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <p className="text-sm font-medium">{article.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{article.category}</p>
                </div>
              ))}
              <button className="w-full text-sm text-primary hover:underline">
                Duyệt Tất Cả Bài Viết →
              </button>
            </CardContent>
          </Card>

          {/* Important Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Cập Nhật Quan Trọng</CardTitle>
              <CardDescription>Đừng bỏ lỡ những hạn chót này</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠ Hạn Chót Nộp Đơn Đại Học Sydney
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  15 Tháng 12, 2024 - Còn 5 ngày
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  📅 Lên Lịch Buổi Tư Vấn
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Giáo viên tư vấn của bạn có sẵn trong tuần này
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
