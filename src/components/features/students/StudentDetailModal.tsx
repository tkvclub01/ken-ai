'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Student } from '@/types'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  FileText,
  Clock,
  MessageSquare,
  Notebook,
  Globe,
  School,
  Info,
  ChevronRight,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react'

interface StudentDetailModalProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (student: Student) => void
  onDelete?: (student: Student) => void
}

export function StudentDetailModal({
  student,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: StudentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedStudent, setEditedStudent] = useState<Student | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!student) return null

  // Initialize edited student when entering edit mode
  const handleEditClick = () => {
    setEditedStudent({ ...student })
    setIsEditing(true)
  }

  // Cancel editing and revert changes
  const handleCancelEdit = () => {
    setEditedStudent(null)
    setIsEditing(false)
  }

  // Save changes
  const handleSaveChanges = async () => {
    if (!editedStudent || !onEdit) return
    
    setIsSaving(true)
    try {
      await onEdit(editedStudent)
      setIsEditing(false)
      setEditedStudent(null)
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Update field value
  const updateField = (field: keyof Student, value: string) => {
    if (editedStudent) {
      setEditedStudent({
        ...editedStudent,
        [field]: value,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-6xl md:max-w-7xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                  {student.full_name}
                </DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 mt-3">
                  <span className="text-sm sm:text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </span>
                  {student.phone && (
                    <span className="text-sm sm:text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {student.phone}
                    </span>
                  )}
                  <Badge className={cn('text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1', getStatusColor(student.status))}>
                    {student.status}
                  </Badge>
                </DialogDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0 shrink-0">
                <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1">
                  Pipeline: {student.current_stage}
                </Badge>
                {onEdit && !isEditing && (
                  <Button size="sm" onClick={handleEditClick}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Information
                  </Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <Separator />

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 md:px-8 pt-3 sm:pt-4">
            <TabsList className="grid w-full grid-cols-4 h-10 sm:h-12">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
            </TabsList>
          </div>

          <Separator className="mt-0" />

          <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Personal Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email Address
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editedStudent?.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="Email address"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {student.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Phone Number
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editedStudent?.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Phone number"
                          />
                        </div>
                      ) : (
                        student.phone && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {student.phone}
                          </p>
                        )
                      )}
                    </div>

                    {/* Date of Birth Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Date of Birth
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            type="date"
                            value={editedStudent?.date_of_birth || ''}
                            onChange={(e) => updateField('date_of_birth', e.target.value)}
                          />
                        </div>
                      ) : (
                        student.date_of_birth && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(student.date_of_birth)}
                          </p>
                        )
                      )}
                    </div>

                    {/* Nationality Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Nationality
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editedStudent?.nationality || ''}
                            onChange={(e) => updateField('nationality', e.target.value)}
                            placeholder="Nationality"
                          />
                        </div>
                      ) : (
                        student.nationality && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {student.nationality}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Target Country Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Target Country
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editedStudent?.target_country || ''}
                            onChange={(e) => updateField('target_country', e.target.value)}
                            placeholder="Target country"
                          />
                        </div>
                      ) : (
                        student.target_country && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {student.target_country}
                          </p>
                        )
                      )}
                    </div>

                    {/* Target School Field */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Target School
                      </p>
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editedStudent?.target_school || ''}
                            onChange={(e) => updateField('target_school', e.target.value)}
                            placeholder="Target school"
                          />
                        </div>
                      ) : (
                        student.target_school && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            {student.target_school}
                          </p>
                        )
                      )}
                    </div>

                    {/* Current Stage - Read Only */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Current Stage
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                          {student.current_stage}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Created At
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(student.created_at)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDate(student.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone - Delete Action */}
              {onDelete && (
                <Card className="border-destructive/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Delete this student</p>
                        <p className="text-xs text-muted-foreground">
                          Once deleted, all data associated with this student will be permanently removed.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(student)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Student
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Uploaded Documents
                    </CardTitle>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16">
                    <div className="rounded-full bg-muted/50 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">
                      No documents uploaded yet
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Upload documents to keep track of student records
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10" />
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-base mb-1">Student Created</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(student.created_at)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Student record was created in the system
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Notes & Comments
                    </CardTitle>
                    <Button size="sm">
                      <Notebook className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16">
                    <div className="rounded-full bg-muted/50 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Notebook className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">
                      No notes added yet
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Add notes to track important information about this student
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
