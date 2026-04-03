'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/')
      const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
      const isLast = index === paths.length - 1

      return { href, title, isLast }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (pathname === '/') return null

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {breadcrumb.isLast ? (
            <span className={cn('font-medium', !breadcrumb.isLast && 'hover:text-foreground')}>
              {breadcrumb.title}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
