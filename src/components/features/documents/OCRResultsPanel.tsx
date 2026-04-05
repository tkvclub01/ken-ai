'use client'

import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Document } from '@/types'
import { Copy, CheckCircle2, AlertCircle, Loader2, Edit2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OCRResultsPanelProps {
  document: Document | null
}

export const OCRResultsPanel = memo(function OCRResultsPanel({ document }: OCRResultsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!document) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>OCR Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>Select a document to view OCR results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ocrData = document.ocr_data as any
  const extractedText = ocrData?.text || ''
  const confidence = ocrData?.confidence || 0
  const fields = ocrData?.fields || {}

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extractedText)
    toast.success('Text copied to clipboard')
  }

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save functionality via API call
    // await updateDocument(document.id, { ocr_data: { ...ocrData, text: editedText } })
    
    // Simulate save delay (remove when implementing real API)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setIsEditing(false)
    toast.success('OCR data updated successfully')
  }

  const getConfidenceColor = (value: number) => {
    if (value >= 90) return 'text-green-600 bg-green-50'
    if (value >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const renderField = (label: string, value: string) => {
    if (!value) return null
    return (
      <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
        <div className="font-medium text-sm">{label}</div>
        <div className="col-span-2 text-sm">{value}</div>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">OCR Results</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={cn(
                  getConfidenceColor(confidence),
                  'font-semibold'
                )}
              >
                {confidence.toFixed(1)}% Confidence
              </Badge>
              {document.ocr_status === 'completed' && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              )}
              {document.ocr_status === 'processing' && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing
                </Badge>
              )}
              {document.ocr_status === 'failed' && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Failed
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditedText(extractedText)
                setIsEditing(true)
              }}
              disabled={isEditing}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="text" className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="text">Extracted Text</TabsTrigger>
            <TabsTrigger value="fields">Parsed Fields</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="h-[calc(100%-3rem)] p-4">
            <ScrollArea className="h-full">
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{extractedText}</pre>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="fields" className="h-[calc(100%-3rem)] p-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {renderField('Full Name', fields?.full_name)}
                {renderField('Email', fields?.email)}
                {renderField('Phone', fields?.phone)}
                {renderField('Date of Birth', fields?.date_of_birth)}
                {renderField('Nationality', fields?.nationality)}
                {renderField('Target Country', fields?.target_country)}
                {renderField('Target School', fields?.target_school)}
                {renderField('Passport Number', fields?.passport_number)}
                {renderField('ID Number', fields?.id_number)}
                {renderField('Address', fields?.address)}
                
                {Object.keys(fields).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No structured fields extracted</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="json" className="h-[calc(100%-3rem)] p-4">
            <ScrollArea className="h-full">
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(ocrData, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})
