'use client'

import { useState, memo } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStudents, useUpdateStudent } from '@/hooks/useStudents'
import { Student } from '@/types'
import { PIPELINE_STAGES } from '@/lib/constants'
import { getStageColor, cn } from '@/lib/utils'
import { Users, Plus } from 'lucide-react'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface KanbanBoardProps {
  onViewDetails: (student: Student) => void
  onEditStudent?: (student: Student) => void
  onDeleteStudent?: (student: Student) => void
}

export function KanbanBoard({
  onViewDetails,
}: KanbanBoardProps) {
  const { data: students = [], isLoading } = useStudents()
  const updateStudent = useUpdateStudent()
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event
    if (!over || !draggedStudent) return

    const newStage = over.id as string
    
    if (draggedStudent.current_stage !== newStage) {
      await updateStudent.mutateAsync({
        id: draggedStudent.id,
        data: { current_stage: newStage },
      })
    }
    
    setDraggedStudent(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Student Pipeline</h2>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100%-60px)]">
          {PIPELINE_STAGES.map((stage) => (
            <MemoizedPipelineColumn
              key={stage.id}
              stage={stage}
              students={students.filter((s) => s.current_stage === stage.id)}
              onDragStart={setDraggedStudent}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[0]
  students: Student[]
  onDragStart: (student: Student) => void
  onViewDetails: (student: Student) => void
}

function PipelineColumn({ stage, students, onDragStart, onViewDetails }: PipelineColumnProps) {
  return (
    <div
      className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-4"
      style={{ borderTop: `4px solid ${stage.color}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold">{stage.name}</h3>
        </div>
        <Badge variant="secondary">{students.length}</Badge>
      </div>

      <ScrollArea className="h-[calc(100%-50px)]">
        <div className="space-y-3">
          {students.map((student) => (
            <MemoizedStudentCard
              key={student.id}
              student={student}
              onDragStart={() => onDragStart(student)}
              onClick={() => onViewDetails(student)}
            />
          ))}
          {students.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No students in this stage
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Memoize to prevent re-renders when other columns change
const MemoizedPipelineColumn = memo(PipelineColumn)

interface StudentCardProps {
  student: Student
  onDragStart: () => void
  onClick: () => void
}

function StudentCard({ student, onDragStart, onClick }: StudentCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-card group"
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        onDragStart()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">{student.full_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{student.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{student.nationality || 'N/A'}</span>
          <span>{student.target_country || 'N/A'}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {student.status}
          </Badge>
          {student.target_school && (
            <Badge variant="outline" className="text-xs truncate max-w-[120px]">
              {student.target_school}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize to prevent re-renders when parent state changes
const MemoizedStudentCard = memo(StudentCard)
