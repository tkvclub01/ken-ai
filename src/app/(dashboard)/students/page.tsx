'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/features/students/KanbanBoard'
import { StudentTable } from '@/components/features/students/StudentTable'
import { StudentDetailModal } from '@/components/features/students/StudentDetailModal'
import { StudentForm } from '@/components/features/students/StudentForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useCreateStudent } from '@/hooks/useStudents'
import { toast } from 'sonner'

export default function StudentsPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  // Hook to create student
  const createStudentMutation = useCreateStudent()
  
  const handleCreateStudent = async (data: any) => {
    try {
      await createStudentMutation.mutateAsync(data)
      toast.success('Student created successfully')
      setIsFormOpen(false)
    } catch (error: any) {
      console.error('Failed to create student:', error)
      toast.error('Failed to create student', {
        description: error.message || 'Please try again'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student profiles and track their journey
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
      {view === 'kanban' ? <KanbanBoard /> : <StudentTable />}

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
      <StudentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateStudent}
      />
    </div>
  )
}
