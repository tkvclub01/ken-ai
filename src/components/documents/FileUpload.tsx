'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  studentId: string
  documentCategory?: string
  onUploadComplete?: (documentId: string) => void
}

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'

export function FileUpload({ studentId, documentCategory, onUploadComplete }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null)
  
  const supabase = createClient()

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((file) => {
        toast.error(`File rejected: ${file.file.name}`, {
          description: file.errors[0].message,
        })
      })
      return
    }

    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setSelectedFile(file)
    await uploadFile(file)
  }, [studentId, documentCategory])

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadStatus === 'uploading' || uploadStatus === 'processing',
  })

  const uploadFile = async (file: File) => {
    try {
      setUploadStatus('uploading')
      setUploadProgress(0)

      // Create a unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${studentId}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents-original')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(100)
      
      // Create document record in database
      const { data: docData, error: insertError } = await supabase
        .from('documents')
        .insert({
          student_id: studentId,
          file_path: filePath,
          file_name: file.name,
          file_type: fileExt?.toUpperCase() || 'UNKNOWN',
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'uploaded',
          ocr_status: 'pending',
          document_category: documentCategory || 'Unknown',
        })
        .select()
        .single()

      if (insertError) throw insertError

      setUploadedDocumentId(docData.id)
      setUploadStatus('uploaded')

      toast.success('File uploaded successfully!', {
        description: 'Starting OCR processing...',
      })

      // Trigger OCR processing
      await triggerOCRProcessing(docData.id, filePath)

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred',
      })
      setSelectedFile(null)
    }
  }

  const triggerOCRProcessing = async (documentId: string, filePath: string) => {
    try {
      setUploadStatus('processing')

      // Get signed URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('documents-original')
        .createSignedUrl(filePath, 60) // 60 seconds expiry

      if (!urlData?.signedUrl) {
        throw new Error('Failed to generate file URL')
      }

      // Call the OCR Edge Function
      const response = await supabase.functions.invoke('ocr-process', {
        body: {
          documentId,
          fileUrl: urlData.signedUrl,
          documentType: documentCategory?.toLowerCase() || 'passport',
        },
      })

      if (response.error) throw response.error

      setUploadStatus('completed')
      
      toast.success('OCR processing completed!', {
        description: 'Ready for verification',
      })

      onUploadComplete?.(documentId)

    } catch (error: any) {
      console.error('OCR processing error:', error)
      setUploadStatus('error')
      toast.error('OCR processing failed', {
        description: error.message || 'Please try again manually',
      })
      
      // Update document status to error
      await supabase
        .from('documents')
        .update({
          ocr_status: 'rejected',
          rejection_reason: error.message,
        })
        .eq('id', documentId)
    }
  }

  const removeFile = async () => {
    if (selectedFile && uploadedDocumentId) {
      // Delete from storage
      await supabase.storage
        .from('documents-original')
        .remove([selectedFile.name])
      
      // Delete from database
      await supabase
        .from('documents')
        .delete()
        .eq('id', uploadedDocumentId)
    }

    setSelectedFile(null)
    setUploadedDocumentId(null)
    setUploadStatus('idle')
    setUploadProgress(0)
  }

  const getStatusIcon() {
    switch (uploadStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'processing':
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      default:
        return <File className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusText() {
    switch (uploadStatus) {
      case 'idle':
        return 'Drag & drop or click to select'
      case 'uploading':
        return `Uploading... ${uploadProgress}%`
      case 'uploaded':
        return 'Upload complete'
      case 'processing':
        return 'Processing with AI...'
      case 'completed':
        return 'Ready for verification'
      case 'error':
        return 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-all duration-200 ease-in-out
            ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
            ${isFocused ? 'border-primary ring-2 ring-primary/20' : ''}
            ${uploadStatus === 'uploading' || uploadStatus === 'processing' 
              ? 'pointer-events-none opacity-50' 
              : 'cursor-pointer hover:border-primary/50'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <div className="p-3 bg-muted rounded-full">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop file here' : getStatusText()}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, PDF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {uploadStatus !== 'uploading' && uploadStatus !== 'processing' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="space-y-2">
            <Progress value={uploadStatus === 'uploading' ? uploadProgress : 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {uploadStatus === 'uploading' ? 'Uploading to storage...' : 'AI is extracting data...'}
            </p>
          </div>
        )}

        {/* Status Badge */}
        {uploadStatus !== 'idle' && (
          <div className="flex justify-center">
            <Badge variant={uploadStatus === 'error' ? 'destructive' : 'secondary'}>
              {getStatusText()}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}
