'use client'

import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Document } from '@/types'
import { ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react'

interface DocumentViewerProps {
  document: Document | null
}

export const DocumentViewer = memo(function DocumentViewer({ document }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!document) {
    return (
      <Card className="flex items-center justify-center h-[600px]">
        <div className="text-center text-muted-foreground">
          <p>Select a document to view</p>
        </div>
      </Card>
    )
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25))
  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const getFileUrl = () => {
    // Construct Supabase storage URL
    const bucket = 'documents'
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${document.file_path}`
  }

  const renderFile = () => {
    const fileUrl = getFileUrl()
    const fileType = document.mime_type?.toLowerCase()

    if (fileType?.includes('pdf')) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full border rounded"
          style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
        />
      )
    }

    if (fileType?.includes('image')) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={fileUrl}
            alt={document.file_name}
            className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-muted-foreground">Preview not available for this file type</p>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{document.file_name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{document.document_type}</Badge>
              <Badge variant="secondary">{document.ocr_status}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRotate}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(getFileUrl(), '_blank')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[600px] w-full">
          {renderFile()}
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
})
