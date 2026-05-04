'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2, Sparkles, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  studentId?: string
}

interface FileUploadState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'classifying' | 'completed' | 'error' | 'review'
  documentType?: string
  extractedData?: any
  error?: string
  confidence?: number
}

export function UploadZone({
  onFilesSelected,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 20 * 1024 * 1024, // 20MB
  maxFiles = 10,
  studentId,
}: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + uploadingFiles.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files`)
      return
    }

    if (!studentId) {
      toast.error('Please select a student first')
      return
    }

    const newFiles: FileUploadState[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])
    onFilesSelected(acceptedFiles)

    // Simulate upload and classification progress
    newFiles.forEach((fileInfo, index) => {
      simulateUploadAndClassification(index, newFiles.length)
    })
  }, [maxFiles, onFilesSelected, uploadingFiles.length, studentId])

  const simulateUploadAndClassification = (fileIndex: number, totalFiles: number) => {
    setIsProcessing(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 50) {
        // Upload complete, start classification
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, progress, status: 'classifying' } : f
          )
        )
      }
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        // Simulate AI classification completing
        const documentTypes = ['passport', 'academic_transcript', 'visa_application', 'english_certificate', 'other']
        const randomDocType = documentTypes[Math.floor(Math.random() * documentTypes.length)]
        const confidence = 0.7 + Math.random() * 0.3 // 0.7 to 1.0
        
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? {
              ...f,
              progress: 100,
              status: 'review',
              documentType: randomDocType,
              confidence,
              extractedData: { confidence },
            } : f
          )
        )
        
        // Check if all files are done
        setUploadingFiles((prev) => {
          const allDone = prev.every(f => f.status === 'review' || f.status === 'completed' || f.status === 'error')
          if (allDone) {
            setIsProcessing(false)
            toast.success(`AI classification complete for ${prev.length} document(s)`)
          }
          return prev
        })
      } else {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, progress, status: 'uploading' } : f
          )
        )
      }
    }, 300)
  }

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirmUpload = () => {
    // In real implementation, this would call the server action
    toast.success('Documents confirmed and saved!')
    setUploadingFiles([])
  }

  const handleCancelUpload = () => {
    setUploadingFiles([])
    setIsProcessing(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium">Drop the files here...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, DOC, DOCX, PNG, JPG (max 10MB each)
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, DOC, DOCX, PNG, JPG (max 10MB each, max {maxFiles} files)
                </p>
                <Button className="mt-4" variant="outline">
                  Select Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Processing ({uploadingFiles.length} document{uploadingFiles.length > 1 ? 's' : ''})
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancelUpload}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmUpload}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Save
              </Button>
            </div>
          </div>

          {/* Batch Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">
                {uploadingFiles.filter(f => f.status === 'completed' || f.status === 'review').length}
              </div>
              <div className="text-xs text-muted-foreground">Processed</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">
                {uploadingFiles.filter(f => f.status === 'classifying').length}
              </div>
              <div className="text-xs text-muted-foreground">Classifying</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">
                {uploadingFiles.filter(f => f.status === 'error').length}
              </div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </div>

          {/* Individual File Progress */}
          <div className="space-y-3">
            {uploadingFiles.map((fileInfo, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  {fileInfo.status === 'completed' || fileInfo.status === 'review' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : fileInfo.status === 'error' ? (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  ) : fileInfo.status === 'classifying' ? (
                    <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
                  ) : (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      {fileInfo.file.name}
                      {fileInfo.documentType && (
                        <Badge variant="secondary" className="text-xs">
                          {fileInfo.documentType.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(fileInfo.progress)}%
                      </span>
                      {fileInfo.confidence && fileInfo.status === 'review' && (
                        <Badge variant="outline" className="text-xs">
                          {(fileInfo.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      )}
                      {(fileInfo.status === 'pending' || fileInfo.status === 'uploading') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={fileInfo.progress} className="h-2" />
                  {fileInfo.status === 'classifying' && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI is analyzing document content...
                    </p>
                  )}
                  {fileInfo.error && (
                    <p className="text-xs text-red-600 mt-2">{fileInfo.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
