'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Activity, Database, Clock, Zap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface QueryInfo {
  queryKey: string[]
  state: {
    status: string
    dataUpdatedAt: number
    error?: any
    data?: any
    fetchStatus: string
  }
  observers: number
  isStale: boolean
}

/**
 * Query Performance Dashboard
 * Displays real-time React Query cache status and performance metrics
 */
export function QueryPerformanceDashboard() {
  const queryClient = useQueryClient()
  const [queries, setQueries] = useState<QueryInfo[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Get all queries from cache
  const updateQueries = () => {
    const cache = queryClient.getQueryCache()
    const allQueries = cache.getAll()
    
    const queryInfos: QueryInfo[] = allQueries.map((query: any) => ({
      queryKey: query.queryKey,
      state: {
        status: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        error: query.state.error,
        data: query.state.data,
        fetchStatus: query.state.fetchStatus,
      },
      observers: query.getObserversCount(),
      isStale: query.isStale(),
    }))

    setQueries(queryInfos)
    setLastUpdate(new Date())
  }

  // Initial load
  useEffect(() => {
    updateQueries()
  }, [queryClient])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(updateQueries, 2000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Calculate statistics
  const stats = {
    total: queries.length,
    active: queries.filter(q => q.observers > 0).length,
    stale: queries.filter(q => q.isStale).length,
    fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    errors: queries.filter(q => q.state.status === 'error').length,
    success: queries.filter(q => q.state.status === 'success').length,
  }

  // Calculate cache hit rate (approximate)
  const cacheHitRate = stats.total > 0 
    ? Math.round(((stats.success - stats.stale) / stats.success) * 100)
    : 0

  // Format time ago
  const timeAgo = (timestamp: number) => {
    if (!timestamp) return 'Never'
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Get query size estimate
  const getQuerySize = (data: any): string => {
    if (!data) return '0 B'
    const bytes = new Blob([JSON.stringify(data)]).size
    
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Query Performance Dashboard</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={updateQueries}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Database className="h-5 w-5 text-blue-500" />}
            label="Total Queries"
            value={stats.total.toString()}
            color="blue"
          />
          
          <StatCard
            icon={<Zap className="h-5 w-5 text-green-500" />}
            label="Active"
            value={stats.active.toString()}
            color="green"
          />
          
          <StatCard
            icon={<Clock className="h-5 w-5 text-orange-500" />}
            label="Stale"
            value={stats.stale.toString()}
            color="orange"
          />
          
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            label="Errors"
            value={stats.errors.toString()}
            color="red"
          />
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cache Hit Rate</span>
            <span className="text-sm text-muted-foreground">{cacheHitRate}%</span>
          </div>
          <Progress value={cacheHitRate} className="h-2" />
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>

        {/* Query List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Active Queries</h3>
          
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-3">
              {queries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No queries in cache
                </div>
              ) : (
                queries.map((query, index) => (
                  <QueryItem
                    key={index}
                    query={query}
                    timeAgo={timeAgo}
                    getQuerySize={getQuerySize}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    green: 'bg-green-50 dark:bg-green-950',
    orange: 'bg-orange-50 dark:bg-orange-950',
    red: 'bg-red-50 dark:bg-red-950',
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function QueryItem({
  query,
  timeAgo,
  getQuerySize,
}: {
  query: QueryInfo
  timeAgo: (ts: number) => string
  getQuerySize: (data: any) => string
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'loading': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getFetchStatusIcon = (status: string) => {
    switch (status) {
      case 'fetching':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'idle':
        return <CheckCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Query Key */}
          <div className="flex items-center gap-2 mb-1">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
              {query.queryKey.join(' › ')}
            </code>
            <Badge variant="outline" className="text-xs">
              {query.observers} observer{query.observers !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${getStatusColor(query.state.status)}`}>
              {query.state.status}
            </Badge>
            
            {query.isStale && (
              <Badge variant="outline" className="text-xs">
                Stale
              </Badge>
            )}
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getFetchStatusIcon(query.state.fetchStatus)}
              {query.state.fetchStatus}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Updated: {timeAgo(query.state.dataUpdatedAt)}</span>
            <span>Size: {getQuerySize(query.state.data)}</span>
          </div>
        </div>

        {/* Error Indicator */}
        {query.state.error && (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}
      </div>
    </div>
  )
}
