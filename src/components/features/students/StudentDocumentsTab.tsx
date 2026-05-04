'use client'

import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Document } from '@/types'
import { useStudentDocuments, useUploadStudentDocument, useDeleteStudentDocument } from '@/hooks/useStudents'
import { FileText, Upload, Trash2, Download, Calendar, File, Sparkles, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { processMultipleDocuments } from '@/actions/documents'
import { UploadZone } from '@/components/features/documents/UploadZone'

interface StudentDocumentsTabProps {
  studentId: string
}

export function StudentDocumentsTab({ studentId }: StudentDocumentsTabProps) {
  const queryClient = useQueryClient()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('passport')
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResults, setBatchResults] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { data: documents, isLoading } = useStudentDocuments(studentId)
  const uploadMutation = useUploadStudentDocument()
  const deleteMutation = useDeleteStudentDocument()

  // Handle upload dialog state change - reset form when closing
  const handleUploadDialogChange = (open: boolean) => {
    setUploadDialogOpen(open)
    if (!open) {
      // Reset all form state when dialog closes
      setSelectedFile(null)
      setDocumentType('passport')
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File quá lớn', {
          description: 'Kích thước file không được vượt quá 20MB'
        })
        return
      }
      setSelectedFile(file)
    }
  }

  // Handle multi-file upload with AI processing
  const handleBatchUpload = async (files: File[]) => {
    setIsBatchProcessing(true)
    try {
      const uploadedFiles = files.map(file => ({
        file,
        studentId,
      }))

      const result = await processMultipleDocuments(uploadedFiles)
      
      if (result.success) {
        setBatchResults(result.results)
        toast.success(result.message || 'Documents processed successfully')
        
        // Refresh documents list
        queryClient.invalidateQueries({ queryKey: ['student-documents', studentId] })
      } else {
        toast.error(result.message || 'Failed to process documents')
      }
    } catch (error: any) {
      toast.error('Processing failed', {
        description: error.message
      })
    } finally {
      setIsBatchProcessing(false)
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file')
      return
    }

    try {
      await uploadMutation.mutateAsync({
        studentId,
        file: selectedFile,
        documentType,
      })
      setUploadDialogOpen(false)
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  // Handle delete
  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      await deleteMutation.mutateAsync({
        id: documentToDelete.id,
        filePath: documentToDelete.file_path,
      })
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      passport: 'Hộ chiếu',
      visa: 'Visa',
      transcript: 'Bảng điểm',
      diploma: 'Bằng cấp',
      ielts: 'Chứng chỉ IELTS',
      recommendation: 'Thư giới thiệu',
      motivation_letter: 'Thư động lực',
      financial_proof: 'Chứng minh tài chính',
      health_certificate: 'Giấy khám sức khỏe',
      other: 'Khác',
    }
    return types[type] || type
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading documents...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Student Documents</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track student documents
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Batch Summary - Shows aggregated profile from uploaded documents */}
      {batchResults.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Extracted Student Profile (AI-Generated)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{batchResults.find(r => r.documentType === 'passport')?.extractedData?.fullName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{batchResults.find(r => r.extractedData?.email)?.extractedData?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nationality:</span>
                <p className="font-medium">{batchResults.find(r => r.documentType === 'passport')?.extractedData?.nationality || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">GPA:</span>
                <p className="font-medium">{batchResults.find(r => r.documentType === 'academic_transcript')?.extractedData?.gpa || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Documents Processed:</span>
                <p className="font-medium">{batchResults.filter(r => r.status === 'success').length} / {batchResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {!documents || documents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload documents to keep track of student records
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{doc.file_name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_path, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <File className="h-4 w-4" />
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(doc.created_at)}</span>
                </div>
                {doc.ocr_status && doc.ocr_status !== 'pending' && (
                  <Badge 
                    variant={doc.ocr_status === 'completed' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    OCR: {doc.ocr_status}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload Documents with AI Classification
            </DialogTitle>
            <DialogDescription>
              Upload multiple documents for this student. AI will automatically classify and extract data from each file.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <UploadZone
              studentId={studentId}
              onFilesSelected={handleBatchUpload}
              maxFiles={10}
            />
          </div>
          {batchResults.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Processing Results
              </h4>
              <div className="space-y-2 text-sm">
                {batchResults.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="truncate">{result.fileName}</span>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status === 'success' ? result.documentType : 'Error'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document{' '}
              <strong>{documentToDelete?.file_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
