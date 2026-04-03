'use client'

import { useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Textarea } from '@/components/ui/textarea'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  showAIRewrite?: boolean
  onAIRewrite?: (content: string) => Promise<string>
}

export function RichTextEditor({
  content: initialContent = '',
  onChange,
  placeholder = 'Start typing or use AI to rewrite...',
  showAIRewrite = true,
  onAIRewrite,
}: RichTextEditorProps) {
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration errors
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const handleAIRewrite = async () => {
    if (!onAIRewrite) return

    const content = editor.getText()
    if (!content.trim()) {
      toast.error('Please enter some text to rewrite')
      return
    }

    setIsAIProcessing(true)
    try {
      const rewrittenContent = await onAIRewrite(content)
      editor.commands.setContent(rewrittenContent)
      toast.success('Content rewritten successfully!')
    } catch (error) {
      toast.error('Failed to rewrite content')
      console.error('AI Rewrite error:', error)
    } finally {
      setIsAIProcessing(false)
    }
  }

  const handleCopy = async () => {
    const content = editor.getHTML()
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Content copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Rich Text Editor</CardTitle>
          <div className="flex items-center gap-2">
            {showAIRewrite && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIRewrite}
                disabled={isAIProcessing}
                className="gap-2"
              >
                {isAIProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Rewrite
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/50">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
          >
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>

          <div className="w-px h-6 mx-2 bg-border" />

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>

          <div className="w-px h-6 mx-2 bg-border" />

          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none"
        />
      </CardContent>
    </Card>
  )
}
