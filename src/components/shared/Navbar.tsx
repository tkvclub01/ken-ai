'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import { CommandPalette } from './CommandPalette'

export function Navbar() {
  const { theme, setTheme, toggleTheme } = useThemeStore()
  const { user } = useUserStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
        {/* Search */}
        <div className="flex-1 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 w-64"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-muted-foreground flex-1 text-left">
              Search...
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {user?.email ? (
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.email || 'Guest User'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette Modal */}
      {searchOpen && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  )
}
