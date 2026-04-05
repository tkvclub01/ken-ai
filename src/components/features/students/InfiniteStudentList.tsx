'use client'

import { useEffect } from 'react'
import { useInfiniteStudents } from '@/hooks/useInfiniteStudents'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Eye, Pencil, AlertCircle } from 'lucide-react'
import { usePrefetch } from '@/hooks/usePrefetch'

/**
 * Component hiển thị danh sách students với infinite scroll
 * Tự động load thêm khi user scroll xuống
 * 
 * Features:
 * - Auto-load on scroll (intersection observer)
 * - Prefetch student details on hover
 * - Loading skeletons
 * - Error handling
 * - Empty state
 */
export function InfiniteStudentList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteStudents()
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Load trước 200px trước khi user scroll tới
  })
  
  const { prefetchStudent } = usePrefetch()
  
  // Tự động load trang tiếp theo khi sentinel vào viewport
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    )
  }
  
  // Error state
  if (isError) {
    return (
      <Card className="p-8 text-center border-destructive">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Có lỗi xảy ra
        </h3>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'Không thể tải danh sách students'}
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Thử lại
        </Button>
      </Card>
    )
  }
  
  // Flatten all pages into single array
  const allStudents = data?.pages.flatMap(page => page.students) || []
  
  // Empty state
  if (allStudents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground mb-2">📭</div>
        <h3 className="text-lg font-semibold mb-2">Không có students</h3>
        <p className="text-sm text-muted-foreground">
          Chưa có students nào trong hệ thống
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Student cards */}
      {allStudents.map((student) => (
        <Card 
          key={student.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onMouseEnter={() => prefetchStudent(student.id)}
        >
          <CardContent className="p-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {student.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {student.current_stage}
                  </Badge>
                  
                  {student.status && (
                    <Badge 
                      variant={student.status === 'active' ? 'default' : 'outline'}
                    >
                      {student.status}
                    </Badge>
                  )}
                  
                  <Badge variant="outline">
                    {formatDate(student.created_at)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" title="Xem chi tiết">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Chỉnh sửa">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Sentinel element cho infinite scroll */}
      <div ref={ref} className="py-8 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">
              Đang tải thêm students...
            </span>
          </div>
        )}
        
        {!hasNextPage && allStudents.length > 0 && (
          <div className="text-center space-y-2">
            <div className="text-2xl">✨</div>
            <p className="text-sm text-muted-foreground">
              Đã hiển thị tất cả {allStudents.length} students
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
