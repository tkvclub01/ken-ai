'use client'

import { useState, useEffect, useRef } from 'react'
import { chatWithAI, getConversationHistory, getUserConversations, deleteConversation, generateEmailDraft } from '@/actions/chat'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Send, Plus, Trash2, MessageSquare, Mail, Loader2, User, Bot, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: any
}

interface Conversation {
  id: string
  title: string
  updated_at: string
  students?: { full_name: string } | null
}

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailPurpose, setEmailPurpose] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [generatedEmail, setGeneratedEmail] = useState({ subject: '', body: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [convToDelete, setConvToDelete] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (currentConvId) {
      loadConversation(currentConvId)
    }
  }, [currentConvId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    const response = await getUserConversations()
    if (response.success) {
      setConversations(response.conversations)
    }
  }

  const loadConversation = async (convId: string) => {
    const response = await getConversationHistory(convId)
    if (response.success) {
      setMessages(response.messages)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message to UI immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }])

    // Call AI
    const response = await chatWithAI(userMessage, currentConvId, selectedStudent || null)

    if (response.success) {
      setCurrentConvId(response.conversationId || null)
      
      // Add AI response to UI
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        metadata: { sources: response.sources },
      }])

      // Refresh conversations list to update title
      loadConversations()
    } else {
      toast.error('Không thể gửi tin nhắn', {
        description: response.error,
      })
    }

    setLoading(false)
  }

  const handleNewChat = () => {
    setCurrentConvId(null)
    setMessages([])
    setInput('')
  }

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConvToDelete(convId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteConversation = async () => {
    if (!convToDelete) return
    
    const response = await deleteConversation(convToDelete)
    if (response.success) {
      loadConversations()
      if (currentConvId === convToDelete) {
        handleNewChat()
      }
      toast.success('Đã xóa cuộc trò chuyện')
    }
    setDeleteDialogOpen(false)
    setConvToDelete(null)
  }

  const handleGenerateEmail = async () => {
    if (!emailPurpose.trim()) {
      toast.error('Vui lòng nhập mục đích email')
      return
    }

    setLoading(true)
    const response = await generateEmailDraft(emailPurpose, selectedStudent || undefined)
    
    if (response.success) {
      setGeneratedEmail({ subject: response.subject, body: response.body })
      toast.success('Đã tạo email!')
    } else {
      toast.error('Không thể tạo email', {
        description: response.error,
      })
    }
    
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Đã sao chép vào clipboard!')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <Button onClick={handleNewChat} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Cuộc Trò Chuyện Mới
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setCurrentConvId(conv.id)}
                  className={`
                    group flex items-center justify-between p-3 rounded-lg cursor-pointer
                    ${currentConvId === conv.id ? 'bg-accent' : 'hover:bg-accent/50'}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">{conv.title}</span>
                    </div>
                    {conv.students && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Học sinh: {conv.students.full_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(conv.updated_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
            </Button>
            <div>
              <h2 className="font-semibold">Trợ Lý AI</h2>
              <p className="text-xs text-muted-foreground">
                Được cung cấp bởi KEN AI với cơ sở kiến thức
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedStudent || ''} onValueChange={(v) => setSelectedStudent(v || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn học sinh (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Không chọn học sinh</SelectItem>
                {/* Populate with students in real app */}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Soạn Email
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chào mừng đến với KEN AI Chat</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Hỏi tôi bất cứ điều gì về chính sách du học, yêu cầu visa, hoặc quy trình nộp đơn đại học.
                  Tôi có quyền truy cập vào cơ sở kiến thức để cung cấp thông tin chính xác.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    {message.role === 'user' ? (
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    ) : (
                      <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground inline-block' : ''}>
                      <CardContent className="p-3">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.metadata?.sources && message.metadata.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Nguồn:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sources.map((source: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {source.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            Sao Chép
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Hỏi về yêu cầu visa, chính sách đại học, hoặc quy trình nộp đơn..."
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              className="self-end"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Email Draft Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Soạn Email</DialogTitle>
            <DialogDescription>
              AI sẽ tạo một email chuyên nghiệp dựa trên mục đích của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Mục Đích Email</Label>
              <Textarea
                id="purpose"
                value={emailPurpose}
                onChange={(e) => setEmailPurpose(e.target.value)}
                placeholder="Ví dụ: Yêu cầu bảng điểm từ trường đại học, Hỏi về yêu cầu học bổng..."
                rows={4}
              />
            </div>
            <div>
              <Label>Bối Cảnh Học Sinh (Tùy Chọn)</Label>
              <Select value={selectedStudent || ''} onValueChange={(v) => setSelectedStudent(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học sinh để bao gồm chi tiết của họ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn học sinh</SelectItem>
                  {/* Populate with students */}
                </SelectContent>
              </Select>
            </div>
            {generatedEmail.subject && (
              <div className="space-y-2">
                <Label>Email Đã Tạo</Label>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <strong>Tiêu Đề:</strong> {generatedEmail.subject}
                    </div>
                    <div className="whitespace-pre-wrap">{generatedEmail.body}</div>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(generatedEmail.subject + '\n\n' + generatedEmail.body)}>
                    Sao Chép Vào Clipboard
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleGenerateEmail} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tạo Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Cuộc Trò Chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn cuộc trò chuyện và tất cả tin nhắn của nó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
