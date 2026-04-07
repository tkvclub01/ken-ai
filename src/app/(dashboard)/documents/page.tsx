'use client'

import { useState } from 'react'
import { UploadZone } from '@/components/features/documents/UploadZone'
import { DocumentViewer } from '@/components/features/documents/DocumentViewer'
import { OCRResultsPanel } from '@/components/features/documents/OCRResultsPanel'
import { DocumentTable } from '@/components/features/documents/DocumentTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Upload } from 'lucide-react'
import { Document } from '@/types'

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tài Liệu</h1>
        <p className="text-muted-foreground">
          Tải lên, quản lý và xử lý tài liệu học sinh với OCR
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Tải Lên
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-2">
            <FileText className="h-4 w-4" />
            Duyệt Tài Liệu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <UploadZone onFilesSelected={(files) => console.log('Selected files:', files)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <DocumentTable 
                onSelectDocument={setSelectedDocument}
                onViewDetail={() => setView('detail')}
              />
            </div>
            <div className="space-y-4">
              <DocumentViewer document={selectedDocument} />
              <OCRResultsPanel document={selectedDocument} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
