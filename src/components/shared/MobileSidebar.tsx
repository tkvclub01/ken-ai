'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, LayoutDashboard, Users, FileText, MessageSquare, BookOpen, BarChart3, Settings } from 'lucide-react'
import { NAVIGATION } from '@/lib/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Icon mapping helper
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    LayoutDashboard,
    Users,
    FileText,
    MessageSquare,
    BookOpen,
    BarChart3,
    Settings,
  }
  return icons[iconName] || null
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sheet on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center border-b px-6">
              <span className="text-lg font-bold">KEN AI</span>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-6">
                {Object.entries(
                  NAVIGATION.reduce((acc, item) => {
                    const group = item.group || 'other'
                    if (!acc[group]) acc[group] = []
                    acc[group].push(item)
                    return acc
                  }, {} as Record<string, typeof NAVIGATION>)
                ).map(([group, items]) => (
                  <div key={group} className="space-y-2">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      {group.replace('-', ' ')}
                    </h4>
                    {items.map((item) => {
                      const IconComponent = getIcon(item.icon as string)
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            isActive && 'bg-primary text-primary-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {IconComponent && <IconComponent className="h-4 w-4" />}
                            <span>{item.title}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant={isActive ? 'secondary' : 'outline'}
                              className="ml-auto"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4">
              <p className="text-xs text-muted-foreground text-center">
                KEN AI v1.0.0
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
