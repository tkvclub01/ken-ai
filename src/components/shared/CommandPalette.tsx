'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DialogProps } from '@radix-ui/react-dialog'
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react'
import { NAVIGATION } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Navigation">
          {NAVIGATION.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => handleSelect(item.href)}
            >
              <span className="flex items-center gap-2">
                {item.badge && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    {item.badge}
                  </Badge>
                )}
                {item.title}
              </span>
              {item.group === 'settings' && (
                <CommandShortcut>
                  <Settings className="h-3 w-3" />
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem value="create-student" onSelect={() => handleSelect('/students?action=create')}>
            <User className="mr-2 h-4 w-4" />
            <span>Create Student</span>
          </CommandItem>
          <CommandItem value="upload-document" onSelect={() => handleSelect('/documents?tab=upload')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
          </CommandItem>
          <CommandItem value="view-analytics" onSelect={() => handleSelect('/analytics')}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>View Analytics</span>
          </CommandItem>
          <CommandItem value="settings" onSelect={() => handleSelect('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
