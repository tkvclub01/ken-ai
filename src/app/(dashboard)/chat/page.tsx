'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/features/ai/RichTextEditor'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [rewriteStyle, setRewriteStyle] = useState('professional')

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSending(true)
    try {
      // TODO: Implement actual chat functionality
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Message sent!')
      setMessage('')
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleAIRewrite = async (content: string): Promise<string> => {
    // TODO: Implement actual AI rewrite with Gemini
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    const styles: Record<string, string> = {
      professional: `Dear Sir/Madam,\n\n${content}\n\nBest regards`,
      casual: `Hey there!\n\n${content}\n\nCheers!`,
      formal: `To Whom It May Concern,\n\n${content}\n\nRespectfully yours,`,
      friendly: `Hi!\n\n${content}\n\nWarm wishes,`,
    }

    return styles[rewriteStyle] || content
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground">
          Intelligent conversations powered by KEN AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <RichTextEditor
                content={message}
                onChange={setMessage}
                placeholder="Type your message here or use AI Rewrite..."
                showAIRewrite
                onAIRewrite={handleAIRewrite}
              />

              <div className="flex items-center justify-between pt-4 border-t">
                <Button onClick={handleSendMessage} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="rewrite-style">Rewrite Style</Label>
                <Select value={rewriteStyle} onValueChange={(value: string | null) => value && setRewriteStyle(value)}>
                  <SelectTrigger id="rewrite-style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">AI Writing Assistant</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use AI Rewrite to transform your text into different styles:
                </p>
                <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Professional for business emails</li>
                  <li>Casual for informal messages</li>
                  <li>Formal for official documents</li>
                  <li>Friendly for personal communication</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
