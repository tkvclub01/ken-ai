'use client'

import { QueryPerformanceDashboard } from '@/components/shared/QueryPerformanceDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Activity, BookOpen, Users, FileText } from 'lucide-react'

/**
 * Demo page to showcase Query Performance Dashboard
 * Route: /admin/query-dashboard
 */
export default function QueryDashboardPage() {
  const supabase = createClient()

  // Trigger some queries to populate the cache
  const { data: students } = useQuery({
    queryKey: ['students-demo'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .limit(10)
      return data
    },
  })

  const { data: knowledge } = useQuery({
    queryKey: ['knowledge-demo'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .limit(5)
      return data
    },
  })

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Query Performance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor React Query cache performance in real-time
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Students Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{students?.length || 0}</p>
            <p className="text-xs text-muted-foreground">records cached</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              Knowledge Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{knowledge?.length || 0}</p>
            <p className="text-xs text-muted-foreground">articles cached</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Total Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2+</p>
            <p className="text-xs text-muted-foreground">active in cache</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard */}
      <QueryPerformanceDashboard />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Understanding the Query Performance Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Statistics</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li><strong>Total Queries:</strong> All queries currently in cache</li>
              <li><strong>Active:</strong> Queries with active observers (components using them)</li>
              <li><strong>Stale:</strong> Queries that need refetching</li>
              <li><strong>Errors:</strong> Queries that failed</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Cache Hit Rate</h3>
            <p className="text-sm text-muted-foreground">
              Percentage of queries served from cache vs. network. Higher is better!
              Target: &gt;80% for optimal performance.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Query List</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Shows all cached queries with their status</li>
              <li>Green = Success, Red = Error, Yellow = Loading</li>
              <li>"Stale" badge means data needs refresh</li>
              <li>Observer count shows how many components use this query</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Actions</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li><strong>Refresh:</strong> Manually update the dashboard</li>
              <li><strong>Auto-refresh:</strong> Update every 2 seconds automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
