'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
}

export function UploadZone({
  onFilesSelected,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
}: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ file: File; progress: number; status: 'pending' | 'uploading' | 'completed' | 'error' }>>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + uploadingFiles.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files`)
      return
    }

    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])
    onFilesSelected(acceptedFiles)

    // Simulate upload progress
    newFiles.forEach((fileInfo, index) => {
      simulateUpload(index, newFiles.length)
    })
  }, [maxFiles, onFilesSelected, uploadingFiles.length])

  const simulateUpload = (fileIndex: number, totalFiles: number) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, progress: 100, status: 'completed' } : f
          )
        )
      } else {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, progress, status: 'uploading' } : f
          )
        )
      }
    }, 200)
  }

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
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
        <div className="space-y-3">
          <h3 className="font-semibold">Upload Progress</h3>
          {uploadingFiles.map((fileInfo, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
            >
              <File className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {fileInfo.file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(fileInfo.progress)}%
                    </span>
                    {fileInfo.status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {fileInfo.status !== 'completed' && (
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
                <Progress
                  value={fileInfo.progress}
                  className="h-2 mt-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
