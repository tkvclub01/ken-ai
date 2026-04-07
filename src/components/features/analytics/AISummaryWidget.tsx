'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export const AISummaryWidget = memo(function AISummaryWidget() {
  // Mock AI summary - in production, this would come from your AI service
  const summary = {
    date: new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    highlights: [
      '3 học sinh mới đăng ký hôm nay',
      '5 hồ sơ visa được phê duyệt trong tuần này',
      '2 tài liệu đang chờ xác minh',
    ],
    alerts: [
      'Phỏng vấn đã lên lịch cho John Doe vào ngày mai lúc 10 giờ sáng',
      'Hạn chót visa cho Jane Smith còn 3 ngày nữa',
    ],
    suggestions: [
      'Theo dõi 5 hồ sơ đang chờ xử lý',
      'Xem xét 3 bài nộp tài liệu mới',
      'Chuẩn bị cho các buổi phỏng vấn sắp tới',
    ],
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Bản Tin Hàng Ngày KEN AI</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">{summary.date}</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
          >
            Làm Mới
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Highlights */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <h4 className="mb-3 text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Điểm Nổi Bật Hôm Nay
          </h4>
          <ul className="space-y-2.5">
            {summary.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-green-900 dark:text-green-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alerts */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
          <h4 className="mb-3 text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Cảnh Báo & Nhắc Nhở
          </h4>
          <ul className="space-y-2.5">
            {summary.alerts.map((alert, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-orange-900 dark:text-orange-200">
                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
          <h4 className="mb-3 text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Đề Xuất Từ AI
          </h4>
          <ul className="space-y-2.5">
            {summary.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-purple-900 dark:text-purple-200">
                <Brain className="mt-0.5 h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
})
