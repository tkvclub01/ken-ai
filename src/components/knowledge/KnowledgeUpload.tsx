'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadKnowledgeFile } from '@/actions/knowledge'
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2, FileText, Image as ImageIcon } from 'lucide-react'

interface KnowledgeUploadProps {
  onUploadComplete?: () => void
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

export function KnowledgeUpload({ onUploadComplete }: KnowledgeUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch categories for dropdown
  const { data: categories, isLoading: categoriesLoading } = useKnowledgeCategories({ activeOnly: true })

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
    await processUpload(file)
  }, [selectedCategory])

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadStatus === 'uploading' || uploadStatus === 'processing',
  })

  const processUpload = async (file: File) => {
    try {
      setUploadStatus('uploading')
      setUploadProgress(30)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Call server action to upload and process
      const result = await uploadKnowledgeFile(file, selectedCategory || undefined)

      clearInterval(progressInterval)

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress(100)
      setUploadStatus('completed')

      toast.success('Document processed successfully!', {
        description: (result as any).chunksCreated && (result as any).chunksCreated > 1
          ? `"${result.title}" split into ${(result as any).chunksCreated} chunks for better search`
          : `"${result.title}" has been added to knowledge base`,
      })

      // Reset after delay with proper cleanup
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      
      resetTimeoutRef.current = setTimeout(() => {
        setSelectedFile(null)
        setUploadStatus('idle')
        setUploadProgress(0)
        onUploadComplete?.()
        resetTimeoutRef.current = null
      }, 2000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred',
      })
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
  }

  const getStatusIcon = (): React.JSX.Element => {
    switch (uploadStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'processing':
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
      default:
        return getFileIcon()
    }
  }

  const getFileIcon = (): React.JSX.Element => {
    if (!selectedFile) return <File className="w-5 h-5 text-muted-foreground" />
    
    const isImage = selectedFile.type.startsWith('image/')
    return isImage ? (
      <ImageIcon className="w-5 h-5 text-blue-500" />
    ) : (
      <FileText className="w-5 h-5 text-purple-500" />
    )
  }

  const getStatusText = (): string => {
    switch (uploadStatus) {
      case 'idle':
        return 'Drag & drop or click to select'
      case 'uploading':
        return `Uploading... ${uploadProgress}%`
      case 'processing':
        return 'Processing with AI...'
      case 'completed':
        return 'Successfully added!'
      case 'error':
        return 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300 border-border/50">
      <div className="space-y-5">
        {/* Category Selection */}
        <div className="space-y-2.5">
          <Label htmlFor="category" className="text-sm font-semibold">Category (Optional)</Label>
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value || '')}
          >
            <SelectTrigger className="h-11 bg-background/50 focus:bg-background transition-all duration-200 border-border/60">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                </div>
              ) : (
                categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-1 ring-offset-background shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-10
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg' 
              : 'border-border/50 hover:border-primary/40'}
            ${isFocused ? 'border-primary ring-2 ring-primary/20 shadow-md' : ''}
            ${uploadStatus === 'uploading' || uploadStatus === 'processing' 
              ? 'pointer-events-none opacity-50' 
              : 'cursor-pointer hover:bg-muted/20'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={`p-4 rounded-full transition-all duration-300 ${
              isDragActive ? 'bg-primary/20 scale-110' : 'bg-muted/50'
            }`}>
              <Upload className={`w-7 h-7 transition-colors duration-200 ${
                isDragActive ? 'text-primary' : 'text-muted-foreground/60'
              }`} />
            </div>
            
            <div className="space-y-1.5">
              <p className="text-base font-semibold">
                {isDragActive ? 'Drop file here' : getStatusText()}
              </p>
              <p className="text-xs text-muted-foreground/70 font-medium">
                PDF, TXT, MD, PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl border border-border/30 shadow-sm">
            <div className="flex items-center space-x-3.5">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground/70 font-medium">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {uploadStatus !== 'uploading' && uploadStatus !== 'processing' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="space-y-3">
            <Progress value={uploadProgress} className="h-2.5" />
            <p className="text-xs text-muted-foreground/70 text-center font-medium">
              {uploadStatus === 'uploading' 
                ? 'Uploading to storage...' 
                : 'AI is extracting and processing content...'}
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

        {/* Help Text */}
        {uploadStatus === 'idle' && (
          <div className="text-xs text-muted-foreground/70 space-y-1.5 pt-2 border-t border-border/30">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
              <span className="font-medium">Images will be processed with OCR</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
              <span className="font-medium">PDFs will have text extracted automatically</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
              <span className="font-medium">Content will be added to knowledge base</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
