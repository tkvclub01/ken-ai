'use client'

import { Sidebar } from '@/components/shared/Sidebar'
import { Navbar } from '@/components/shared/Navbar'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumbs />
            </div>

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
