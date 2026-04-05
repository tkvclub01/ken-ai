'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'
import { DollarSign, TrendingUp, Users, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const RevenueTracking = memo(function RevenueTracking() {
  const { data: analytics, isLoading } = useAnalytics()

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

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue || 0),
      description: '+20.1% from last month',
      icon: DollarSign,
      trend: 'up',
    },
    {
      title: 'Pending Revenue',
      value: formatCurrency(analytics?.pendingRevenue || 0),
      description: 'Awaiting payment confirmation',
      icon: TrendingUp,
      trend: 'neutral',
    },
    {
      title: 'Active Students',
      value: analytics?.activeStudents || 0,
      description: '+15% from last month',
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Documents Processed',
      value: analytics?.totalDocuments || 0,
      description: 'This month',
      icon: FileText,
      trend: 'up',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              {metric.trend === 'up' && (
                <p className="text-xs text-green-600 mt-1">↑ {metric.description.split(' ')[0]}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})
