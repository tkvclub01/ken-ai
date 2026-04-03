'use client'

import { useState, useEffect } from 'react'
import { searchKnowledge, addKnowledge, updateKnowledgeFromFeedback, verifyKnowledge, deleteKnowledge } from '@/actions/knowledge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, Plus, ThumbsUp, ThumbsDown, Edit, Trash2, Check, X, Loader2, BookOpen, Tag } from 'lucide-react'

interface KnowledgeResult {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  similarity: number
  verified: boolean
  view_count: number
  helpful_count: number
}

export function KnowledgeBaseSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KnowledgeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDoc, setEditingDoc] = useState<KnowledgeResult | null>(null)
  
  // New knowledge form state
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    // Initial load - get popular documents
    handleSearch('')
  }, [])

  const handleSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await searchKnowledge(searchQuery, {
        category: selectedCategory || undefined,
      })
      
      if (response.success) {
        setResults(response.results || [])
      } else {
        toast.error('Search failed', {
          description: response.error,
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKnowledge = async () => {
    if (!newTitle || !newContent) {
      toast.error('Missing fields', {
        description: 'Please fill in title and content',
      })
      return
    }

    const response = await addKnowledge({
      title: newTitle,
      content: newContent,
      category: newCategory || undefined,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    })

    if (response.success) {
      toast.success('Knowledge added!', {
        description: 'Waiting for admin verification',
      })
      setShowAddDialog(false)
      setNewTitle('')
      setNewContent('')
      setNewCategory('')
      setNewTags('')
      handleSearch(query)
    } else {
      toast.error('Failed to add knowledge', {
        description: response.error,
      })
    }
  }

  const handleFeedback = async (docId: string, isHelpful: boolean) => {
    const response = await updateKnowledgeFromFeedback(docId, { isHelpful })
    
    if (response.success) {
      toast.success(isHelpful ? 'Thanks for the feedback!' : 'Feedback recorded')
      // Refresh results
      handleSearch(query)
    }
  }

  const handleVerify = async (docId: string, verified: boolean) => {
    const response = await verifyKnowledge(docId, verified)
    
    if (response.success) {
      toast.success(verified ? 'Document verified!' : 'Verification removed')
      handleSearch(query)
    } else {
      toast.error('Verification failed', {
        description: response.error,
      })
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    const response = await deleteKnowledge(docId)
    
    if (response.success) {
      toast.success('Document deleted')
      handleSearch(query)
    } else {
      toast.error('Delete failed', {
        description: response.error,
      })
    }
  }

  const openEditDialog = (doc: KnowledgeResult) => {
    setEditingDoc(doc)
    setNewTitle(doc.title)
    setNewContent(doc.content)
    setNewCategory(doc.category || '')
    setNewTags(doc.tags?.join(', ') || '')
  }

  const handleEdit = async () => {
    if (!editingDoc || !newTitle || !newContent) return

    const response = await updateKnowledgeFromFeedback(editingDoc.id, {
      title: newTitle,
      content: newContent,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    })

    if (response.success) {
      toast.success('Document updated!')
      setEditingDoc(null)
      handleSearch(query)
    } else {
      toast.error('Update failed', {
        description: response.error,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">AI-powered semantic search for policies and procedures</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search knowledge base... (e.g., 'Australia visa requirements')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Scholarships">Scholarships</SelectItem>
                <SelectItem value="Academic Requirements">Academic Requirements</SelectItem>
                <SelectItem value="English Tests">English Tests</SelectItem>
                <SelectItem value="Application Process">Application Process</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleSearch(query)}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found. Try a different search term or add new knowledge.</p>
            </CardContent>
          </Card>
        ) : (
          results.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{doc.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {doc.category && (
                        <Badge variant="secondary">{doc.category}</Badge>
                      )}
                      {doc.verified && (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {(doc.similarity * 100).toFixed(0)}% match
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(doc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line mb-4">
                  {doc.content.slice(0, 300)}
                  {doc.content.length > 300 && '...'}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {doc.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span>{doc.view_count} views</span>
                    <span className="mx-2">•</span>
                    <span>{doc.helpful_count} found helpful</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(doc.id, true)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Helpful
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(doc.id, false)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Not Helpful
                    </Button>
                    {!doc.verified && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleVerify(doc.id, true)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Knowledge Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Knowledge</DialogTitle>
            <DialogDescription>
              Contribute to the knowledge base. Your submission will be reviewed by an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., New Zealand Visa Requirements"
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter detailed information..."
                rows={10}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., New Zealand"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="visa, requirements, new-zealand"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKnowledge}>
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge</DialogTitle>
            <DialogDescription>
              Update this knowledge entry. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={10}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
