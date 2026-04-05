'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Check, X, RotateCcw, Eye, Download } from 'lucide-react'
import type { Database } from '@/types'

type DocumentRow = Database['public']['Tables']['documents']['Row']
type OCRData = NonNullable<DocumentRow['ocr_data']>

interface OCRVerificationProps {
  documentId: string
  onVerified?: () => void
}

export function OCRVerification({ documentId, onVerified }: OCRVerificationProps) {
  const supabase = createClient()
  const [document, setDocument] = useState<DocumentRow | null>(null)
  const [ocrData, setOcrData] = useState<OCRData | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'image' | 'data'>('split')
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*, students(full_name)')
        .eq('id', documentId)
        .single()

      if (error) throw error

      setDocument(data)
      setOcrData(data.ocr_data as OCRData)
      setEditedData(data.ocr_data as any || {})

      // Get signed URL for image viewing
      if (data.file_path) {
        const { data: urlData } = await supabase.storage
          .from('documents-original')
          .createSignedUrl(data.file_path, 3600) // 1 hour
        
        if (urlData?.signedUrl) {
          setImageUrl(urlData.signedUrl)
        }
      }
    } catch (error: any) {
      console.error('Error loading document:', error)
      toast.error('Failed to load document', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const calculateConfidence = (fieldName: string): number => {
    if (!ocrData) return 0
    
    const confidence = (ocrData as any).confidence || 0.8
    // Simple heuristic - could be improved based on field-specific confidence
    return Math.round(confidence * 100)
  }

  const handleVerify = async () => {
    try {
      setIsVerifying(true)

      // Update document with verified data
      const { error: docError } = await supabase
        .from('documents')
        .update({
          ocr_status: 'completed',
          ocr_data: editedData,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (docError) throw docError

      // Update student record with verified information
      if (document?.student_id) {
        const studentUpdates: Record<string, any> = {}
        
        if (editedData.fullName) studentUpdates.full_name = editedData.fullName
        if (editedData.dateOfBirth) studentUpdates.date_of_birth = editedData.dateOfBirth
        if (editedData.passportNumber) studentUpdates.passport_number = editedData.passportNumber
        if (editedData.email) studentUpdates.email = editedData.email
        if (editedData.phone) studentUpdates.phone = editedData.phone

        if (Object.keys(studentUpdates).length > 0) {
          const { error: studentError } = await supabase
            .from('students')
            .update(studentUpdates)
            .eq('id', document.student_id)

          if (studentError) throw studentError
        }
      }

      toast.success('Document verified successfully!', {
        description: 'Data has been saved to student record',
      })

      onVerified?.()
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.error('Verification failed', {
        description: error.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          ocr_status: 'rejected',
          rejection_reason: 'Manual rejection by user',
        })
        .eq('id', documentId)

      if (error) throw error

      toast.success('Document rejected', {
        description: 'You can re-upload a clearer image',
      })

      onVerified?.()
    } catch (error: any) {
      console.error('Rejection error:', error)
      toast.error('Rejection failed', {
        description: error.message,
      })
    }
  }

  const handleReprocess = async () => {
    try {
      // Reset status to pending
      const { error } = await supabase
        .from('documents')
        .update({
          ocr_status: 'pending',
          extracted_data: null,
          verified_by: null,
          verified_at: null,
        })
        .eq('id', documentId)

      if (error) throw error

      toast.success('Reprocessing initiated', {
        description: 'AI will extract data again',
      })

      // Trigger OCR again (in production, this would call the edge function)
      onVerified?.()
    } catch (error: any) {
      console.error('Reprocess error:', error)
      toast.error('Reprocessing failed', {
        description: error.message,
      })
    }
  }

  const downloadJson = () => {
    if (!editedData) return
    const blob = new Blob([JSON.stringify(editedData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `extracted-data-${documentId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    )
  }

  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'passportNumber', label: 'Passport Number', type: 'text' },
    { key: 'nationality', label: 'Nationality', type: 'text' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'gpa', label: 'GPA', type: 'number' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'address', label: 'Address', type: 'text' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Verify Document</h2>
          <p className="text-sm text-muted-foreground">
            Review and edit AI-extracted data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={document.ocr_status === 'completed' ? 'default' : 'secondary'}>
            {document.ocr_status}
          </Badge>
          {ocrData && (
            <Badge variant="outline">
              Confidence: {Math.round((ocrData as any).confidence * 100)}%
            </Badge>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="split">Split View</TabsTrigger>
          <TabsTrigger value="image">Image Only</TabsTrigger>
          <TabsTrigger value="data">Data Only</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Image Viewer */}
        {(viewMode === 'split' || viewMode === 'image') && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Original Document</h3>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => window.open(imageUrl, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Open
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadJson}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="p-4 bg-muted/50 min-h-[600px] flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded document"
                  className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                />
              ) : (
                <p className="text-muted-foreground">No image available</p>
              )}
            </div>
          </Card>
        )}

        {/* Data Extraction Form */}
        {(viewMode === 'split' || viewMode === 'data') && (
          <Card>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Extracted Data</h3>
              <p className="text-xs text-muted-foreground">
                Click on any field to edit. Green highlights indicate high confidence.
              </p>
            </div>
            <div className="p-4 space-y-4">
              {fields.map((field) => {
                const value = editedData[field.key] || ''
                const confidence = calculateConfidence(field.key)
                const isHighConfidence = confidence >= 80

                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <div className="flex items-center space-x-2">
                        <Progress value={confidence} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {confidence}%
                        </span>
                      </div>
                    </div>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className={isHighConfidence ? 'border-green-500 focus-visible:ring-green-500' : ''}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                )
              })}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isVerifying}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleReprocess}
                  disabled={isVerifying}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reprocess
                </Button>
                
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isVerifying ? 'Verifying...' : 'Verify & Save'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
