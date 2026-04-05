'use client'

import { StatsCards } from '@/components/features/analytics/StatsCards'
import { PipelineChart } from '@/components/features/analytics/PipelineChart'
import { ActivityFeed } from '@/components/features/analytics/ActivityFeed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Student management and document processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Users className="mr-1 h-4 w-4" />
            Team Member
          </span>
        </div>
      </div>

      {/* Employee Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active students under your care
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visa Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              This academic year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Charts & Student Overview */}
        <div className="lg:col-span-4 space-y-6">
          <PipelineChart />
          
          {/* My Students Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>Students assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {['NT', 'TH', 'MA', 'LV', 'PC'][i - 1]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Student Name {i}</p>
                        <p className="text-xs text-muted-foreground">Pipeline Stage: School Submission</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Last Contact</p>
                      <p className="text-sm font-medium">{i * 2} days ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Document Processing & Activity */}
        <div className="lg:col-span-3 space-y-6">
          <ActivityFeed />
          
          {/* Document Processing Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Queue</CardTitle>
              <CardDescription>Pending OCR verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Passport Scan</span>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Student: Nguyen Van A</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors">
                      Verify
                    </button>
                    <button className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Add Student</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Upload Document</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Verify Documents</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <Clock className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">My Tasks</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
