'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileCheck, GraduationCap, MessageCircle } from 'lucide-react'

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
          <p className="text-muted-foreground mt-1">
            Track your study abroad journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
            <GraduationCap className="mr-1 h-4 w-4" />
            Student
          </span>
        </div>
      </div>

      {/* Student Stats Cards - Personal Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Application Status</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">In Progress</div>
            <p className="text-xs text-muted-foreground mt-1">
              School submission stage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8/12</div>
            <p className="text-xs text-muted-foreground mt-1">
              4 documents pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dec 15</div>
            <p className="text-xs text-muted-foreground mt-1">
              University application
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Counselor</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ms. Lan Anh</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for chat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - My Pipeline & Documents */}
        <div className="lg:col-span-4 space-y-6">
          {/* My Application Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>My Application Pipeline</CardTitle>
              <CardDescription>Track your progress through each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pipeline Stages */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  {/* Stage Items */}
                  {[
                    { name: 'Consultation', status: 'completed', date: 'Nov 1, 2024', icon: MessageCircle },
                    { name: 'Document Collection', status: 'completed', date: 'Nov 15, 2024', icon: FileCheck },
                    { name: 'School Submission', status: 'current', date: 'In Progress', icon: BookOpen },
                    { name: 'Visa Application', status: 'pending', date: 'Expected: Jan 2025', icon: FileCheck },
                    { name: 'Pre-departure', status: 'pending', date: 'Expected: Feb 2025', icon: GraduationCap },
                  ].map((stage, index) => (
                    <div key={stage.name} className="relative flex items-start gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 ${
                        stage.status === 'completed' 
                          ? 'border-green-500 bg-green-500/10 text-green-600' 
                          : stage.status === 'current'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted text-muted-foreground'
                      }`}>
                        <stage.icon className="h-6 w-6" />
                        <span className="text-xs font-medium mt-0.5">{index + 1}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <h4 className={`font-semibold ${
                          stage.status === 'current' ? 'text-primary' : ''
                        }`}>
                          {stage.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{stage.date}</p>
                        {stage.status === 'current' && (
                          <p className="text-xs text-primary mt-1">● In Progress</p>
                        )}
                        {stage.status === 'completed' && (
                          <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Documents */}
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>Upload and track your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Passport Copy', status: 'verified', date: 'Uploaded Nov 10' },
                  { name: 'Academic Transcript', status: 'verified', date: 'Uploaded Nov 12' },
                  { name: 'English Certificate', status: 'pending', date: 'Uploaded Nov 20' },
                  { name: 'Recommendation Letter 1', status: 'required', date: 'Not uploaded' },
                  { name: 'Recommendation Letter 2', status: 'required', date: 'Not uploaded' },
                  { name: 'Statement of Purpose', status: 'required', date: 'Not uploaded' },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileCheck className={`h-5 w-5 ${
                        doc.status === 'verified' 
                          ? 'text-green-600' 
                          : doc.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-muted-foreground'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === 'verified'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : doc.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {doc.status === 'verified' ? '✓ Verified' : doc.status === 'pending' ? '⏳ Pending' : '⚠ Required'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-primary hover:underline">
                View All Documents →
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Resources & Support */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <FileCheck className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Upload Document</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Chat with AI</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Knowledge Base</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">My Profile</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base - Limited Access */}
          <Card>
            <CardHeader>
              <CardTitle>Helpful Resources</CardTitle>
              <CardDescription>Guides and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'How to Apply for a Student Visa', category: 'Visa Guide' },
                { title: 'Preparing for Your IELTS Test', category: 'English Requirements' },
                { title: 'Accommodation Options Abroad', category: 'Living Overseas' },
              ].map((article) => (
                <div key={article.title} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <p className="text-sm font-medium">{article.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{article.category}</p>
                </div>
              ))}
              <button className="w-full text-sm text-primary hover:underline">
                Browse All Articles →
              </button>
            </CardContent>
          </Card>

          {/* Important Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Important Updates</CardTitle>
              <CardDescription>Don't miss these deadlines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠ University of Sydney Application Deadline
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  December 15, 2024 - 5 days remaining
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  📅 Schedule Counseling Session
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Your counselor is available this week
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
