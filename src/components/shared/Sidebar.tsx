'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAVIGATION } from '@/lib/constants'
import { useSidebarStore } from '@/stores/useSidebarStore'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebarStore()

  // Group navigation items
  const groupedNav = NAVIGATION.reduce(
    (acc, item) => {
      const group = item.group || 'other'
      if (!acc[group]) acc[group] = []
      acc[group].push(item)
      return acc
    },
    {} as Record<string, typeof NAVIGATION>
  )

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null
  }

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-foreground">KEN AI</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8"
        >
          {collapsed ? (
            <LucideIcons.ChevronRight className="h-4 w-4" />
          ) : (
            <LucideIcons.ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-6 px-3">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              {!collapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  {group.replace('-', ' ')}
                </h4>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = (LucideIcons as any)[item.icon]
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
              {!collapsed && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p>KEN AI v1.0.0</p>
          <p className="mt-1">© 2025 All rights reserved</p>
        </div>
      )}
    </div>
  )
}
