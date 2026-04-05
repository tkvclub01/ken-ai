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
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      description: '+20% from last month',
      icon: Users,
      trend: 'positive',
    },
    {
      title: 'Active Students',
      value: stats?.activeStudents || 0,
      description: 'Currently enrolled',
      icon: CheckCircle,
      trend: 'neutral',
    },
    {
      title: 'Pending Documents',
      value: stats?.pendingDocuments || 0,
      description: 'Awaiting processing',
      icon: Clock,
      trend: 'warning',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      description: '+15% from last month',
      icon: DollarSign,
      trend: 'positive',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})
