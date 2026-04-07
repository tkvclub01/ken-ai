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
            <span>Processing...</span>
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
            {selectedStudentIds.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Assign Counselor */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Counselor
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setAssignDialogOpen(true)}>
                  Select Counselor...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Counselor</DialogTitle>
                <DialogDescription>
                  Assign a counselor to {selectedStudentIds.length} selected students
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedCounselor} onValueChange={(value) => value && setSelectedCounselor(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select counselor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counselor-1">John Smith</SelectItem>
                  <SelectItem value="counselor-2">Jane Doe</SelectItem>
                  <SelectItem value="counselor-3">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignCounselor}
                  disabled={!selectedCounselor || bulkAssignCounselor.isPending}
                >
                  {bulkAssignCounselor.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Status */}
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setStatusDialogOpen(true)}>
                  Change Status...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Status</DialogTitle>
                <DialogDescription>
                  Update status for {selectedStudentIds.length} selected students
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedStatus} onValueChange={(value) => value && setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!selectedStatus || bulkUpdateStatus.isPending}
                >
                  {bulkUpdateStatus.isPending ? 'Updating...' : 'Update'}
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
            {bulkExportStudents.isPending ? 'Exporting...' : 'Export CSV'}
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
              Delete
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Students?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete{' '}
                  <strong>{selectedStudentIds.length} students</strong> and all
                  associated data including documents and communications.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={bulkDeleteStudents.isPending}
                >
                  {bulkDeleteStudents.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
