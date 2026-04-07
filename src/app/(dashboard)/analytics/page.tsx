'use client'

import { RevenueTracking } from '@/components/features/analytics/RevenueTracking'
import { CountryDistributionChart } from '@/components/features/analytics/CountryDistributionChart'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { KnowledgeBaseAnalytics } from '@/components/features/analytics/KnowledgeBaseAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, BookOpen } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your student management pipeline
        </p>
      </div>

      {/* Revenue Tracking */}
      <RevenueTracking />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PipelineChart />
        <CountryDistributionChart />
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>

      {/* Knowledge Base Analytics Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Knowledge Base Analytics
          </h2>
          <p className="text-muted-foreground">
            Track article performance and identify content gaps
          </p>
        </div>
        <KnowledgeBaseAnalytics />
      </div>
    </div>
  )
}
