'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { School } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { useUpdateSchoolNotes } from '@/hooks/useSchools'
import { DocumentsTab } from './DocumentsTab'
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  Clock,
  Info,
  Pencil,
  Save,
  X,
  FileText,
  Upload,
} from 'lucide-react'

interface SchoolDetailModalProps {
  school: School | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (school: School) => void
}

export function SchoolDetailModal({
  school,
  open,
  onOpenChange,
  onEdit,
}: SchoolDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSchool, setEditedSchool] = useState<School | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [notes, setNotes] = useState((school as any)?.notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  
  const updateNotesMutation = useUpdateSchoolNotes()

  if (!school) return null

  // Initialize edited school when entering edit mode
  const handleEditClick = () => {
    setEditedSchool({ ...school })
    setIsEditing(true)
  }

  // Cancel editing and revert changes
  const handleCancelEdit = () => {
    setEditedSchool(null)
    setIsEditing(false)
  }

  // Save changes
  const handleSaveChanges = async () => {
    if (!editedSchool || !onEdit) return
    
    setIsSaving(true)
    try {
      await onEdit(editedSchool)
      setIsEditing(false)
      setEditedSchool(null)
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Update field value
  const updateField = (field: keyof School, value: string) => {
    if (editedSchool) {
      setEditedSchool({
        ...editedSchool,
        [field]: value,
      })
    }
  }

  // Save notes
  const handleSaveNotes = async () => {
    try {
      await updateNotesMutation.mutateAsync({ id: school.id, notes })
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  // Cancel notes editing
  const handleCancelNotes = () => {
    setNotes((school as any)?.notes || '')
    setIsEditingNotes(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'terminated':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-6xl md:max-w-7xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 flex items-start gap-4">
                {school.logo_url && (
                  <img
                    src={school.logo_url}
                    alt={`${school.name} logo`}
                    className="w-16 h-16 object-contain rounded-lg bg-white border shadow-sm shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                    {school.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 mt-3">
                    <span className="text-sm sm:text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {school.city ? `${school.city}, ` : ''}{school.country}
                    </span>
                    <Badge className={cn('text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1', getStatusColor(school.partnership_status))}>
                      {school.partnership_status === 'active' ? 'Đang Hợp Tác' :
                       school.partnership_status === 'inactive' ? 'Ngừng Hợp Tác' :
                       school.partnership_status === 'pending' ? 'Chờ Duyệt' : 'Đã Chấm Dứt'}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0 shrink-0">
                {onEdit && !isEditing && (
                  <Button size="sm" onClick={handleEditClick}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Information
                  </Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <Separator />

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 md:px-8 pt-3 sm:pt-4">
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            </TabsList>
          </div>

          <Separator className="mt-0" />

          <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Basic Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* School Name */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        School Name
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedSchool?.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder="School name"
                        />
                      ) : (
                        <p className="text-sm font-medium">{school.name}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Country
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedSchool?.country || ''}
                          onChange={(e) => updateField('country', e.target.value)}
                          placeholder="Country"
                        />
                      ) : (
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {school.country}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        City
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedSchool?.city || ''}
                          onChange={(e) => updateField('city', e.target.value)}
                          placeholder="City"
                        />
                      ) : (
                        school.city && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {school.city}
                          </p>
                        )
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2 sm:col-span-2 md:col-span-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Address
                      </p>
                      {isEditing ? (
                        <Textarea
                          value={editedSchool?.address || ''}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder="Full address"
                          rows={2}
                        />
                      ) : (
                        school.address && (
                          <p className="text-sm font-medium">{school.address}</p>
                        )
                      )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Website
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedSchool?.website || ''}
                          onChange={(e) => updateField('website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      ) : (
                        school.website && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {school.website}
                            </a>
                          </p>
                        )
                      )}
                    </div>

                    {/* Contact Email */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Contact Email
                      </p>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedSchool?.contact_email || ''}
                          onChange={(e) => updateField('contact_email', e.target.value)}
                          placeholder="contact@school.edu"
                        />
                      ) : (
                        school.contact_email && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {school.contact_email}
                          </p>
                        )
                      )}
                    </div>

                    {/* Contact Phone */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Contact Phone
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedSchool?.contact_phone || ''}
                          onChange={(e) => updateField('contact_phone', e.target.value)}
                          placeholder="+1234567890"
                        />
                      ) : (
                        school.contact_phone && (
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {school.contact_phone}
                          </p>
                        )
                      )}
                    </div>

                    {/* Partnership Status - Read Only */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Partnership Status
                      </p>
                      <Badge className={cn('text-sm', getStatusColor(school.partnership_status))}>
                        {school.partnership_status === 'active' ? 'Đang Hợp Tác' :
                         school.partnership_status === 'inactive' ? 'Ngừng Hợp Tác' :
                         school.partnership_status === 'pending' ? 'Chờ Duyệt' : 'Đã Chấm Dứt'}
                      </Badge>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 sm:col-span-2 md:col-span-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Description
                      </p>
                      {isEditing ? (
                        <Textarea
                          value={editedSchool?.description || ''}
                          onChange={(e) => updateField('description', e.target.value)}
                          placeholder="Description about the school..."
                          rows={3}
                        />
                      ) : (
                        school.description && (
                          <p className="text-sm font-medium">{school.description}</p>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Notes Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Internal Notes
                    </CardTitle>
                    {!isEditingNotes ? (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Notes
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelNotes}
                          disabled={updateNotesMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updateNotesMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add internal notes about partnership history, contact preferences, or special agreements..."
                      rows={6}
                      className="resize-none"
                    />
                  ) : notes ? (
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* System Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Created At
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(school.created_at)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDate(school.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0">
              <DocumentsTab schoolId={school.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
