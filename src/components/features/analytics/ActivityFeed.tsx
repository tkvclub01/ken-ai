'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { FileText, MessageSquare, UserPlus } from 'lucide-react'

interface Activity {
  id: string
  type: 'student' | 'document' | 'chat'
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
}

// Mock data - replace with real data from API
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'student',
    title: 'New student registered',
    description: 'John Doe has been added to the system',
    timestamp: new Date().toISOString(),
    user: {
      name: 'John Doe',
    },
  },
  {
    id: '2',
    type: 'document',
    title: 'Document uploaded',
    description: 'Passport uploaded for Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      name: 'Jane Smith',
    },
  },
  {
    id: '3',
    type: 'chat',
    title: 'AI Chat session',
    description: 'Visa consultation completed',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      name: 'Mike Johnson',
    },
  },
]

export const ActivityFeed = memo(function ActivityFeed() {
  const activities = mockActivities

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <UserPlus className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      default:
        return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-500'
      case 'document':
        return 'bg-green-500'
      case 'chat':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from the system</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="relative mt-1">
                  <div
                    className={`h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center gap-2">
                    {activity.user && (
                      <Badge variant="secondary">{activity.user.name}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})
