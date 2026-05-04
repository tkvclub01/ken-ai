'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SchoolEmailTemplate } from '@/types'
import {
  useSchoolEmailTemplates,
  useCreateSchoolEmailTemplate,
  useUpdateSchoolEmailTemplate,
  useDeleteSchoolEmailTemplate,
} from '@/hooks/useSchools'
import { Mail, Plus, Pencil, Trash2, Save, X, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplatesTabProps {
  schoolId: string
}

export function EmailTemplatesTab({ schoolId }: EmailTemplatesTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SchoolEmailTemplate | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject_template: '',
    body_template: '',
    category: '',
    variables: [] as string[],
  })

  // Hooks
  const { data: templates, isLoading } = useSchoolEmailTemplates(schoolId)
  const createMutation = useCreateSchoolEmailTemplate()
  const updateMutation = useUpdateSchoolEmailTemplate()
  const deleteMutation = useDeleteSchoolEmailTemplate()

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      subject_template: '',
      body_template: '',
      category: '',
      variables: [],
    })
  }

  // Open create dialog
  const handleCreateClick = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEditClick = (template: SchoolEmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      subject_template: template.subject_template,
      body_template: template.body_template,
      category: template.category || '',
      variables: template.variables || [],
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (template: SchoolEmailTemplate) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  // Handle create
  const handleCreate = async () => {
    if (!formData.name || !formData.subject_template || !formData.body_template) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      await createMutation.mutateAsync({
        school_id: schoolId,
        ...formData,
        is_active: true,
      })
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  // Handle update
  const handleUpdate = async () => {
    if (!selectedTemplate) return
    if (!formData.name || !formData.subject_template || !formData.body_template) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: formData,
      })
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to update template:', error)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTemplate) return

    try {
      await deleteMutation.mutateAsync(selectedTemplate.id)
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  // Parse variables from text input
  const handleVariablesChange = (value: string) => {
    const vars = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    setFormData(prev => ({ ...prev, variables: vars }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading templates...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage email templates for this school
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="secondary" className="mt-2">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(template)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm truncate">{template.subject_template}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Body Preview:</p>
                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {template.body_template}
                  </p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Used {template.usage_count || 0} times</span>
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for this school. Use {'{{variable_name}}'} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Email"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value || '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="admissions">Admissions</SelectItem>
                  <SelectItem value="visa_support">Visa Support</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Template</Label>
              <Input
                id="subject"
                placeholder="e.g., Welcome to {{school_name}}"
                value={formData.subject_template}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body Template</Label>
              <Textarea
                id="body"
                placeholder="Email body content with {{variables}}..."
                rows={8}
                value={formData.body_template}
                onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variables">Variables (comma-separated)</Label>
              <Input
                id="variables"
                placeholder="e.g., school_name, student_name, contact_person"
                value={formData.variables.join(', ')}
                onChange={(e) => handleVariablesChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                These variables can be used in subject and body using {'{{variable_name}}'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template. Use {'{{variable_name}}'} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value || '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="admissions">Admissions</SelectItem>
                  <SelectItem value="visa_support">Visa Support</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject Template</Label>
              <Input
                id="edit-subject"
                value={formData.subject_template}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-body">Body Template</Label>
              <Textarea
                id="edit-body"
                rows={8}
                value={formData.body_template}
                onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-variables">Variables (comma-separated)</Label>
              <Input
                id="edit-variables"
                value={formData.variables.join(', ')}
                onChange={(e) => handleVariablesChange(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the email template{' '}
              <strong>{selectedTemplate?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
