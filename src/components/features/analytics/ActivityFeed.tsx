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
    title: 'Hồ sơ mới đã đăng ký',
    description: 'John Doe đã được thêm vào hệ thống',
    timestamp: new Date().toISOString(),
    user: {
      name: 'John Doe',
    },
  },
  {
    id: '2',
    type: 'document',
    title: 'Tài liệu đã được tải lên',
    description: 'Hộ chiếu đã được tải lên cho Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      name: 'Jane Smith',
    },
  },
  {
    id: '3',
    type: 'chat',
    title: 'Phiên trò chuyện AI',
    description: 'Tư vấn visa đã hoàn thành',
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
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Hoạt Động Gần Đây</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Cập nhật mới nhất từ hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-900 transition-all duration-200 group"
              >
                <div className="relative mt-1">
                  <div
                    className={`h-10 w-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-semibold leading-none text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    {activity.user && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {activity.user.name}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
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
