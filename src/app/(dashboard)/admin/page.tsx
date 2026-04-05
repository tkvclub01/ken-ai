'use client'

import { useRouter } from 'next/navigation'
import { StatsCards } from '@/components/features/analytics/StatsCards'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { AISummaryWidget } from '@/components/features/analytics/AISummaryWidget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Settings, Shield, DollarSign, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System administration and user management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Shield className="mr-1 h-4 w-4" />
            Administrator
          </span>
        </div>
      </div>

      {/* Admin Stats Cards - Enhanced with user metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Monthly)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground mt-1">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Charts & Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineChart />
          <AISummaryWidget />
          
          {/* Admin-Specific: Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Monthly revenue and expense tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-sm">
                  Revenue chart will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Admin Management */}
        <div className="lg:col-span-3 space-y-6">
          <ActivityFeed />
          
          {/* User Management Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>Quick access to user controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => router.push('/settings/users')}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">All Employees</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Shield className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Roles</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Audit Logs</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Services</span>
                <span className="text-sm font-medium text-green-600">● Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm font-medium text-yellow-600">● 78% Used</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
