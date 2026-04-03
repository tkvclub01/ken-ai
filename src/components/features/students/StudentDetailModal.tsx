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
import { Student } from '@/types'
import { formatDate, getStatusColor } from '@/lib/utils'
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
} from 'lucide-react'

interface StudentDetailModalProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDetailModal({
  student,
  open,
  onOpenChange,
}: StudentDetailModalProps) {
  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{student.full_name}</DialogTitle>
              <DialogDescription className="flex items-center gap-4 mt-2">
                <span>{student.email}</span>
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {student.current_stage}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-y-auto mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.phone}</span>
                    </div>
                    {student.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(student.date_of_birth)}</span>
                      </div>
                    )}
                    {student.nationality && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{student.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Study Information
                  </h3>
                  <div className="space-y-3">
                    {student.target_country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{student.target_country}</span>
                      </div>
                    )}
                    {student.target_school && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{student.target_school}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{student.current_stage}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(student.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{formatDate(student.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Uploaded Documents
                  </h3>
                  <Button size="sm">Upload Document</Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Activity History
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="w-0.5 h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">Student Created</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(student.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes & Comments
                  </h3>
                  <Button size="sm">Add Note</Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Notebook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notes added yet</p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
