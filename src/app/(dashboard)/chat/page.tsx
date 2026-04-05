'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Loader2, Sparkles, Bot, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatSession {
  id: string
  messages: Message[]
  createdAt: Date
  lastUpdated: Date
}

/**
 * Optimized Chat Page with message caching and streaming
 * Features:
 * - React Query caching for chat history
 * - Streaming response simulation
 * - Optimistic updates
 * - Auto-scroll to latest message
 */
export default function ChatPage() {
  const queryClient = useQueryClient()
  const [inputMessage, setInputMessage] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<string>('default')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Fetch chat history with caching
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['chat-history', currentSessionId],
    queryFn: async () => {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Return cached or default messages
      return [] as Message[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  })

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat-history', currentSessionId] })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['chat-history', currentSessionId]) || []

      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: newMessage,
        timestamp: new Date(),
      }

      queryClient.setQueryData(['chat-history', currentSessionId], [...previousMessages, userMessage])

      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-history', currentSessionId], context.previousMessages)
      }
      toast.error('Failed to send message')
    },
    onSuccess: () => {
      // Trigger AI response streaming
      simulateAIResponse()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', currentSessionId] })
    },
  })

  // Simulate AI streaming response
  const simulateAIResponse = async () => {
    setIsStreaming(true)
    
    const assistantMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    // Add empty assistant message
    queryClient.setQueryData(
      ['chat-history', currentSessionId],
      (old: Message[] = []) => [...old, assistantMessage]
    )

    // Simulate streaming
    const response = "This is a simulated AI response with streaming effect. In production, this would connect to your AI service (Gemini, OpenAI, etc.) and stream the response token by token for a better user experience."
    const words = response.split(' ')
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)) // Stream word by word
      
      queryClient.setQueryData(
        ['chat-history', currentSessionId],
        (old: Message[] = []) => {
          const updated = [...old]
          const lastIndex = updated.length - 1
          if (updated[lastIndex]?.id === assistantMessage.id) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: words.slice(0, i + 1).join(' '),
            }
          }
          return updated
        }
      )
    }

    // Mark as complete
    queryClient.setQueryData(
      ['chat-history', currentSessionId],
      (old: Message[] = []) => {
        const updated = [...old]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]?.id === assistantMessage.id) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            isStreaming: false,
          }
        }
        return updated
      }
    )

    setIsStreaming(false)
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (isStreaming) {
      toast.error('Please wait for the current response')
      return
    }

    sendMessageMutation.mutate(inputMessage)
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const messages = chatHistory || []

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Chat
        </h1>
        <p className="text-muted-foreground">
          Intelligent conversations powered by KEN AI
        </p>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with AI</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isStreaming || sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isStreaming || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {isStreaming && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI is typing...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS WITH REACT.MEMO
// ============================================================================

interface ChatMessageProps {
  message: Message
}

const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
        
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
})
