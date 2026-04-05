'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchKnowledge, addKnowledge, updateKnowledgeFromFeedback, verifyKnowledge, deleteKnowledge } from '@/actions/knowledge'
import { useAuth } from '@/hooks/useAuth'
import {
  useKnowledgeCategories,
  useCreateKnowledgeCategory,
  useUpdateKnowledgeCategory,
  useDeleteKnowledgeCategory,
} from '@/hooks/useKnowledgeCategories'
import type { KnowledgeCategory } from '@/types'
import { KnowledgeUpload } from './KnowledgeUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Search, Plus, ThumbsUp, ThumbsDown, Edit, Trash2, Check, X, Loader2, BookOpen, Tag, FolderOpen, Settings, Upload } from 'lucide-react'

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
  const { hasPermission } = useAuth()
  const isAdmin = hasPermission('manage_settings')
  const queryClient = useQueryClient()
  
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDoc, setEditingDoc] = useState<KnowledgeResult | null>(null)
  
  // New knowledge form state
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newTags, setNewTags] = useState('')

  // Category management state
  const [activeTab, setActiveTab] = useState('articles')
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#007AFF',
    icon: '',
  })

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useKnowledgeCategories()
  const createCategory = useCreateKnowledgeCategory()
  const updateCategory = useUpdateKnowledgeCategory()
  const deleteCategory = useDeleteKnowledgeCategory()

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [query])

  // Use React Query for search results caching
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['knowledge-search', debouncedQuery, selectedCategory],
    queryFn: async () => {
      const response = await searchKnowledge(debouncedQuery, {
        category: selectedCategory || undefined,
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Search failed')
      }
      
      return response.results || []
    },
    enabled: true, // Always enabled, even for empty queries
    staleTime: 1000 * 60 * 5, // Cache search results for 5 minutes
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
  })

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
      // Invalidate search cache to refresh results
      queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })
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
      // Invalidate search cache to refresh results
      queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })
    }
  }

  const handleVerify = async (docId: string, verified: boolean) => {
    const response = await verifyKnowledge(docId, verified)
    
    if (response.success) {
      toast.success(verified ? 'Document verified!' : 'Verification removed')
      // Invalidate search cache to refresh results
      queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })
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
      // Invalidate search cache to refresh results
      queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })
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
      // Invalidate search cache to refresh results
      queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })
    } else {
      toast.error('Update failed', {
        description: response.error,
      })
    }
  }

  // Category management handlers
  const openCategoryDialog = (category?: KnowledgeCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        description: '',
        color: '#007AFF',
        icon: '',
      })
    }
    setShowCategoryDialog(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Missing field', {
        description: 'Please enter a category name',
      })
      return
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: categoryForm.name,
          description: categoryForm.description || null,
          color: categoryForm.color,
          icon: categoryForm.icon || null,
        })
        toast.success('Category updated!')
      } else {
        await createCategory.mutateAsync({
          name: categoryForm.name,
          description: categoryForm.description || null,
          color: categoryForm.color,
          icon: categoryForm.icon || null,
        })
        toast.success('Category created!')
      }
      setShowCategoryDialog(false)
      setCategoryForm({ name: '', description: '', color: '#007AFF', icon: '' })
      setEditingCategory(null)
    } catch (error: any) {
      toast.error('Failed to save category', {
        description: error.message,
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await deleteCategory.mutateAsync(id)
      toast.success('Category deleted')
    } catch (error: any) {
      toast.error('Failed to delete category', {
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            AI-powered semantic search for policies and procedures
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setActiveTab('categories')}
            variant="outline"
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="articles" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
            <BookOpen className="w-4 h-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="upload" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="categories" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
              <FolderOpen className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          )}
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">

          {/* Search Bar */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary h-4 w-4 transition-colors duration-200" />
                  <Input
                    placeholder="Search knowledge base... (e.g., 'Australia visa requirements')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 h-11 bg-background/50 focus:bg-background transition-all duration-200 border-border/60 focus:border-primary/50"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] h-11 bg-background/50 focus:bg-background transition-all duration-200 border-border/60">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  className="h-11 px-6 shadow-sm hover:shadow-md transition-all duration-200"
                  disabled
                >
                  Search
                </Button>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="h-11 px-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !searchResults || searchResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found. Try a different search term or add new knowledge.</p>
                </CardContent>
              </Card>
            ) : (
              searchResults.map((doc: KnowledgeResult) => (
                <Card 
                  key={doc.id} 
                  className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 border-border/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <CardTitle className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors duration-200">
                          {doc.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.category && (
                            <Badge variant="secondary" className="font-medium">{doc.category}</Badge>
                          )}
                          {doc.verified && (
                            <Badge className="bg-green-600/90 hover:bg-green-600 transition-colors duration-200 shadow-sm">
                              <Check className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge variant="outline" className="font-mono text-xs">
                            {(doc.similarity * 100).toFixed(0)}% match
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(doc)}
                          className="hover:bg-primary/10 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground/90 whitespace-pre-line leading-relaxed text-sm">
                      {doc.content.slice(0, 300)}
                      {doc.content.length > 300 && '...'}
                    </p>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {doc.tags.map((tag, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs font-medium hover:bg-primary/5 transition-colors duration-200 cursor-default"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground/70 font-medium">
                        <span>{doc.view_count} views</span>
                        <span className="mx-2">•</span>
                        <span>{doc.helpful_count} found helpful</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(doc.id, true)}
                          className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Helpful
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(doc.id, false)}
                          className="hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30 transition-all duration-200"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Not Helpful
                        </Button>
                        {!doc.verified && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerify(doc.id, true)}
                            className="shadow-sm hover:shadow-md transition-all duration-200"
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
        </TabsContent>

        {/* Upload Document Tab */}
        <TabsContent value="upload" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Upload Document or Image</h2>
            <p className="text-muted-foreground text-base">Automatically extract content and add to knowledge base</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <KnowledgeUpload onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['knowledge-search'] })} />
            
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors duration-200">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Select a file</p>
                    <p className="text-muted-foreground/80 leading-relaxed">Upload PDFs, images (PNG, JPG), or text files up to 10MB</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors duration-200">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">AI Processing</p>
                    <p className="text-muted-foreground/80 leading-relaxed">OCR extracts text from images, PDFs are parsed automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors duration-200">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Add to Knowledge Base</p>
                    <p className="text-muted-foreground/80 leading-relaxed">Extracted content is stored with embeddings for semantic search</p>
                  </div>
                </div>
                <div className="pt-5 border-t border-border/30">
                  <p className="text-xs text-muted-foreground/70 font-medium">
                    <strong>Supported formats:</strong> PDF, PNG, JPG, JPEG, WEBP, TXT, MD
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="categories" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Manage Categories</h2>
                <p className="text-muted-foreground text-base">Configure knowledge base categories</p>
              </div>
              <Button 
                onClick={() => openCategoryDialog()}
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Color</TableHead>
                    <TableHead className="font-semibold">Articles</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/60" />
                        <p className="mt-3 text-sm text-muted-foreground">Loading categories...</p>
                      </TableCell>
                    </TableRow>
                  ) : categories?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground/70 font-medium">No categories found</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Create your first category to organize articles</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories?.map((category) => (
                      <TableRow 
                        key={category.id}
                        className="hover:bg-muted/30 transition-colors duration-200 group"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-semibold">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground/80">
                          {category.description || <span className="text-muted-foreground/40 italic">No description</span>}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted/50 px-2.5 py-1 rounded-md font-mono border border-border/30">
                            {category.color}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-medium">
                            {category.article_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={category.is_active ? 'default' : 'secondary'}
                            className={category.is_active ? 'shadow-sm' : ''}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCategoryDialog(category)}
                              className="hover:bg-primary/10 transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={category.article_count > 0}
                              className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>

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
              <Select value={newCategory} onValueChange={(value) => setNewCategory(value || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={newCategory} onValueChange={(value) => setNewCategory(value || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category details'
                : 'Create a new category for organizing knowledge articles'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="e.g., Australia"
              />
            </div>
            <div>
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="cat-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                  placeholder="#007AFF"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cat-icon">Icon (optional)</Label>
              <Input
                id="cat-icon"
                value={categoryForm.icon}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, icon: e.target.value })
                }
                placeholder="e.g., map-pin, book, graduation-cap"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use Lucide icon names
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false)
                setEditingCategory(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
