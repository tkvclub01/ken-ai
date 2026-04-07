'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/features/students/KanbanBoard'
import { StudentTable } from '@/components/features/students/StudentTable'
import { StudentDetailModal } from '@/components/features/students/StudentDetailModal'
import { StudentForm } from '@/components/features/students/StudentForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useCreateStudent, useDeleteStudent, useUpdateStudent } from '@/hooks/useStudents'
import { Student } from '@/types'
import { toast } from 'sonner'

export default function StudentsPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  
  // Hooks
  const createStudentMutation = useCreateStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()
  
  const handleCreateStudent = async (data: any) => {
    try {
      await createStudentMutation.mutateAsync(data)
      toast.success('Tạo hồ sơ thành công')
      setIsFormOpen(false)
    } catch (error: any) {
      console.error('Failed to create student:', error)
      toast.error('Không thể tạo hồ sơ', {
        description: error.message || 'Vui lòng thử lại'
      })
    }
  }

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setIsDetailOpen(true)
  }

  const handleEditStudent = async (student: Student) => {
    try {
      await updateStudentMutation.mutateAsync({
        id: student.id,
        data: {
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          date_of_birth: student.date_of_birth,
          nationality: student.nationality,
          target_country: student.target_country,
          target_school: student.target_school,
          status: student.status,
        },
      })
      toast.success('Cập nhật hồ sơ thành công')
    } catch (error: any) {
      console.error('Failed to update student:', error)
      toast.error('Không thể cập nhật hồ sơ', {
        description: error.message || 'Vui lòng thử lại'
      })
    }
  }

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return
    try {
      await deleteStudentMutation.mutateAsync(studentToDelete.id)
      toast.success('Đã xóa hồ sơ')
    } catch (error: any) {
      toast.error('Không thể xóa hồ sơ', {
        description: error.message || 'Vui lòng thử lại'
      })
    } finally {
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ Sơ</h1>
          <p className="text-muted-foreground">
            Quản lý hồ sơ học sinh và theo dõi hành trình
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
            <TabsList>
              <TabsTrigger value="kanban">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="table">
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsFormOpen(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* View Content */}
      {view === 'kanban' ? (
        <KanbanBoard
          onViewDetails={handleViewDetails}
        />
      ) : (
        <StudentTable />
      )}

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />
      <StudentForm
        student={selectedStudent}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedStudent(null)
        }}
        onSubmit={handleCreateStudent}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Hồ Sơ?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn hồ sơ{' '}
              <strong>{studentToDelete?.full_name}</strong> và tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
