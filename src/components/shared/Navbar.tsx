'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  Check,
  Trash2,
} from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAuth } from '@/hooks/useAuth'
import { CommandPalette } from '@/components/shared/CommandPalette'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export function Navbar() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { theme, setTheme, toggleTheme } = useThemeStore()
  const { user } = useUserStore()
  const [searchOpen, setSearchOpen] = useState(false)
  
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage when component mounts
  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('user_notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Filter out notifications older than 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const filtered = parsed.filter((n: Notification) => {
          const notifDate = new Date(n.time)
          return notifDate > sevenDaysAgo
        })
        
        // If we filtered out any, save the cleaned version
        if (filtered.length !== parsed.length) {
          localStorage.setItem('user_notifications', JSON.stringify(filtered))
        }
        
        setNotifications(filtered)
      } else {
        // Default notifications for first-time users
        const defaultNotifications: Notification[] = [
          {
            id: '1',
            title: 'Document Uploaded',
            message: 'passport_john.pdf has been uploaded successfully',
            time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            read: false,
            type: 'success'
          },
          {
            id: '2',
            title: 'Student Assignment',
            message: 'You have been assigned to student: Sarah Connor',
            time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            read: false,
            type: 'info'
          },
          {
            id: '3',
            title: 'Visa Application',
            message: 'Student visa application for Mike Chen is due tomorrow',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            read: true,
            type: 'warning'
          },
          {
            id: '4',
            title: 'System Update',
            message: 'New features have been added to the platform',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            read: true,
            type: 'info'
          }
        ]
        localStorage.setItem('user_notifications', JSON.stringify(defaultNotifications))
        setNotifications(defaultNotifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Fallback to empty array if localStorage fails
      setNotifications([])
    }
  }

  // Save notifications to localStorage
  const saveNotifications = (newNotifications: Notification[]) => {
    try {
      localStorage.setItem('user_notifications', JSON.stringify(newNotifications))
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    saveNotifications(updated)
  }

  const clearAll = () => {
    setNotifications([])
    saveNotifications([])
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  const formatTimeAgo = (timeString: string) => {
    const time = new Date(timeString)
    const now = new Date()
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

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
            <DropdownMenuTrigger render={<button type="button" aria-label="Toggle theme" />}>
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" aria-label="Notifications" />}>
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {unreadCount} unread
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No notifications
                </div>
              ) : (
                <>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "relative px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0",
                          !notification.read && "bg-accent/50"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {!notification.read && (
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r",
                            getNotificationColor(notification.type)
                          )} />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                !notification.read && "text-foreground",
                                notification.read && "text-muted-foreground"
                              )}>
                                {notification.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.time)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-red-600 hover:text-red-600"
                      onClick={clearAll}
                      disabled={notifications.length === 0}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" aria-label="User menu" />}>
              <div className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 overflow-hidden">
                {user?.email ? (
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {user?.email || 'Guest User'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette Modal */}
      {searchOpen && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  )
}
