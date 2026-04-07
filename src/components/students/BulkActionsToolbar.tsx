'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useBulkStudentOperations } from '@/hooks/useBulkStudentOperations'
import { Users, UserPlus, FileDown, Trash2, AlertTriangle } from 'lucide-react'

interface BulkActionsToolbarProps {
  selectedStudentIds: string[]
  onClearSelection: () => void
}

export function BulkActionsToolbar({
  selectedStudentIds,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const {
    bulkAssignCounselor,
    bulkUpdateStatus,
    bulkDeleteStudents,
    bulkExportStudents,
    operationProgress,
  } = useBulkStudentOperations()

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const handleAssignCounselor = async () => {
    if (!selectedCounselor) return

    await bulkAssignCounselor.mutateAsync({
      studentIds: selectedStudentIds,
      counselorId: selectedCounselor,
    })

    setAssignDialogOpen(false)
    setSelectedCounselor('')
    onClearSelection()
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return

    await bulkUpdateStatus.mutateAsync({
      studentIds: selectedStudentIds,
      status: selectedStatus,
    })

    setStatusDialogOpen(false)
    setSelectedStatus('')
    onClearSelection()
  }

  const handleDelete = async () => {
    await bulkDeleteStudents.mutateAsync(selectedStudentIds)
    setDeleteDialogOpen(false)
    onClearSelection()
  }

  const handleExport = async () => {
    await bulkExportStudents.mutateAsync(selectedStudentIds)
    onClearSelection()
  }

  if (selectedStudentIds.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 z-50 min-w-[600px]">
      {/* Progress Bar */}
      {operationProgress && operationProgress.status === 'processing' && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Đang xử lý...</span>
            <span>
              {operationProgress.completed} / {operationProgress.total}
            </span>
          </div>
          <Progress
            value={(operationProgress.completed / operationProgress.total) * 100}
            className="h-2"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-7">
            <Users className="h-3 w-3 mr-1" />
            {selectedStudentIds.length} đã chọn
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Assign Counselor */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Phân Công Giáo Viên
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setAssignDialogOpen(true)}>
                  Chọn Giáo Viên...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Phân Công Giáo Viên</DialogTitle>
                <DialogDescription>
                  Phân công giáo viên cho {selectedStudentIds.length} hồ sơ đã chọn
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedCounselor} onValueChange={(value) => value && setSelectedCounselor(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counselor-1">John Smith</SelectItem>
                  <SelectItem value="counselor-2">Jane Doe</SelectItem>
                  <SelectItem value="counselor-3">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleAssignCounselor}
                  disabled={!selectedCounselor || bulkAssignCounselor.isPending}
                >
                  {bulkAssignCounselor.isPending ? 'Đang phân công...' : 'Phân Công'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Status */}
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Cập Nhật Trạng Thái
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setStatusDialogOpen(true)}>
                  Thay Đổi Trạng Thái...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cập Nhật Trạng Thái</DialogTitle>
                <DialogDescription>
                  Cập nhật trạng thái cho {selectedStudentIds.length} hồ sơ đã chọn
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedStatus} onValueChange={(value) => value && setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Tiềm Năng</SelectItem>
                  <SelectItem value="active">Đang Hoạt Động</SelectItem>
                  <SelectItem value="inactive">Không Hoạt Động</SelectItem>
                  <SelectItem value="completed">Hoàn Thành</SelectItem>
                  <SelectItem value="rejected">Từ Chối</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!selectedStatus || bulkUpdateStatus.isPending}
                >
                  {bulkUpdateStatus.isPending ? 'Đang cập nhật...' : 'Cập Nhật'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={bulkExportStudents.isPending}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {bulkExportStudents.isPending ? 'Đang xuất...' : 'Xuất CSV'}
          </Button>

          {/* Delete */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={bulkDeleteStudents.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Xóa Hồ Sơ?
                </DialogTitle>
                <DialogDescription>
                  Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn{' '}
                  <strong>{selectedStudentIds.length} hồ sơ</strong> và tất cả
                  dữ liệu liên quan bao gồm tài liệu và thông tin liên lạc.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={bulkDeleteStudents.isPending}
                >
                  {bulkDeleteStudents.isPending ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
