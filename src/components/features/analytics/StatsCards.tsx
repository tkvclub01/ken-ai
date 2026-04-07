'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CheckCircle, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/lib/utils'

export const StatsCards = memo(function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Tổng Số Hồ Sơ',
      value: stats?.totalStudents || 0,
      description: '+20% so với tháng trước',
      icon: Users,
      trend: 'positive',
    },
    {
      title: 'Hồ Sơ Đang Hoạt Động',
      value: stats?.activeStudents || 0,
      description: 'Đang theo học',
      icon: CheckCircle,
      trend: 'neutral',
    },
    {
      title: 'Tài Liệu Chờ Xử Lý',
      value: stats?.pendingDocuments || 0,
      description: 'Đang chờ xử lý',
      icon: Clock,
      trend: 'warning',
    },
    {
      title: 'Tổng Doanh Thu',
      value: formatCurrency(stats?.totalRevenue || 0),
      description: '+15% so với tháng trước',
      icon: DollarSign,
      trend: 'positive',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {cards.map((card, index) => {
        const Icon = card.icon
        const gradientColors = [
          'from-blue-500 to-blue-600',
          'from-purple-500 to-purple-600',
          'from-orange-500 to-orange-600',
          'from-green-500 to-green-600'
        ]
        const borderColors = [
          'border-blue-200 dark:border-blue-800',
          'border-purple-200 dark:border-purple-800',
          'border-orange-200 dark:border-orange-800',
          'border-green-200 dark:border-green-800'
        ]
        const textGradients = [
          'from-blue-600 to-blue-700',
          'from-purple-600 to-purple-700',
          'from-orange-600 to-orange-700',
          'from-green-600 to-green-700'
        ]
        
        return (
          <Card key={index} className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${borderColors[index]}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.title}</CardTitle>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientColors[index]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold bg-gradient-to-r ${textGradients[index]} bg-clip-text text-transparent`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})
