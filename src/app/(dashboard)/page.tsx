'use client'

import { StatsCards } from '@/components/features/analytics/StatsCards'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { AISummaryWidget } from '@/components/features/analytics/AISummaryWidget'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to KEN AI - Your intelligent student management platform
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Charts */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineChart />
          <AISummaryWidget />
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-3">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
