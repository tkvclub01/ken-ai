'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Loader2, Sparkles, Bot, User, Plus, Trash2, MessageSquare, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { chatWithAI, getConversationHistory, getUserConversations, deleteConversation } from '@/actions/chat'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [streamingContent, setStreamingContent] = useState('')
  const [isThinking, setIsThinking] = useState(false) // NEW: Thinking state indicator
  const [showSidebar, setShowSidebar] = useState(true) // NEW: Toggle sidebar

  // Fetch user conversations for sidebar - NEW: Session management
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      const result = await getUserConversations()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch conversations')
      }
      return result.conversations || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Fetch chat history with caching - USE REAL SERVER ACTION
  const { data: chatHistory, isLoading, refetch } = useQuery({
    queryKey: ['chat-history', currentSessionId],
    queryFn: async () => {
      if (currentSessionId === 'default') {
        return [] as Message[]
      }
      
      const result = await getConversationHistory(currentSessionId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch chat history')
      }
      
      // Transform database messages to UI format
      return (result.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      })) as Message[]
    },
    enabled: currentSessionId !== 'default',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  })

  // Delete conversation mutation - NEW: Session management
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await deleteConversation(conversationId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete conversation')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Conversation deleted')
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] })
      // If deleted current conversation, reset to default
      if (currentSessionId !== 'default') {
        setCurrentSessionId('default')
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete conversation')
    },
  })

  // Create new conversation - NEW: Session management
  const handleNewChat = () => {
    setCurrentSessionId('default')
    setInputMessage('')
    setIsStreaming(false)
    setStreamingContent('')
    setIsThinking(false)
  }

  // Switch to existing conversation - NEW: Session management
  const handleSwitchConversation = (conversationId: string) => {
    setCurrentSessionId(conversationId)
    setInputMessage('')
    setIsStreaming(false)
    setStreamingContent('')
    setIsThinking(false)
  }

  // Send message mutation - INTEGRATE WITH REAL SERVER ACTION
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Call the real chatWithAI server action
      const result = await chatWithAI(message, currentSessionId === 'default' ? null : currentSessionId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }
      
      return result
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
    onError: (err: any, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-history', currentSessionId], context.previousMessages)
      }
      toast.error(err.message || 'Failed to send message')
      setIsThinking(false) // Hide thinking state on error
    },
    onSuccess: (result) => {
      // Update conversation ID if this was a new conversation
      if (currentSessionId === 'default' && result.conversationId) {
        setCurrentSessionId(result.conversationId)
        // Invalidate conversations list to show new conversation
        queryClient.invalidateQueries({ queryKey: ['user-conversations'] })
      }
      
      // Show streaming effect for better UX
      simulateAIResponse(result.response)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', currentSessionId] })
      setIsThinking(false) // Hide thinking state when done
    },
  })

  // Stream AI response with REAL content - OPTIMIZED: Use local state for streaming
  const simulateAIResponse = async (realResponse: string) => {
    setIsStreaming(true)
    setStreamingContent('')
    
    const assistantMessageId = `ai-${Date.now()}`

    // Add placeholder assistant message immediately
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    queryClient.setQueryData(
      ['chat-history', currentSessionId],
      (old: Message[] = []) => [...old, placeholderMessage]
    )

    // Stream the REAL AI response word by word for better UX
    const words = realResponse.split(' ')
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30)) // Faster streaming
      setStreamingContent(words.slice(0, i + 1).join(' '))
    }

    // COMMIT: Update React Query cache only once at the end with REAL response
    queryClient.setQueryData(
      ['chat-history', currentSessionId],
      (old: Message[] = []) => {
        const updated = [...old]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]?.id === assistantMessageId) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: realResponse,
            isStreaming: false,
          }
        }
        return updated
      }
    )

    setStreamingContent('')
    setIsStreaming(false)
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (isStreaming || isThinking) {
      toast.error('Please wait for the current response')
      return
    }

    setIsThinking(true) // NEW: Show thinking state
    sendMessageMutation.mutate(inputMessage)
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, streamingContent])

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
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - NEW: Session Management */}
      {showSidebar && (
        <Card className="w-64 flex-shrink-0 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Conversations</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewChat}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="space-y-1">
                {loadingConversations ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                ) : conversations && conversations.length > 0 ? (
                  conversations.map((conv: any) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors',
                        currentSessionId === conv.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => handleSwitchConversation(conv.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{conv.title || 'New Chat'}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversationMutation.mutate(conv.id)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Chat
            </h1>
            <p className="text-muted-foreground">
              Intelligent conversations powered by KEN AI
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? 'Hide' : 'Show'} History
          </Button>
        </div>

      {/* Messages Area */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with AI</p>
                <p className="text-sm mt-2">Ask about visa requirements, student applications, or university information</p>
              </div>
            ) : (
              messages.map((message, index) => {
                // If this is the last message and it's streaming, show local streaming content
                const isLastMessage = index === messages.length - 1
                const displayMessage = isLastMessage && message.isStreaming && streamingContent
                  ? { ...message, content: streamingContent }
                  : message
                
                return <ChatMessage key={message.id} message={displayMessage} />
              })
            )}
            {/* NEW: Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">KEN AI is thinking...</span>
                  </div>
                </div>
              </div>
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
              onKeyDown={handleKeyPress}
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
          {isThinking && !isStreaming && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing your request...
            </div>
          )}
        </CardContent>
      </Card>
      </div>
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
