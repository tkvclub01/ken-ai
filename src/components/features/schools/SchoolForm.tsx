'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { School, SchoolInsert } from '@/types'
import { useCreateSchool, useUpdateSchool } from '@/hooks/useSchools'
import { uploadFile, validateFile } from '@/lib/file-utils'
import { ImagePlus, X, Building2 } from 'lucide-react'

const schoolSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  partnership_status: z.enum(['active', 'inactive', 'pending', 'terminated']),
  description: z.string().optional(),
})

type SchoolFormData = z.infer<typeof schoolSchema>

interface SchoolFormProps {
  school?: School | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SchoolForm({
  school,
  open,
  onOpenChange,
}: SchoolFormProps) {
  const isEditing = !!school
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(school?.logo_url || null)
  
  const createSchoolMutation = useCreateSchool()
  const updateSchoolMutation = useUpdateSchool()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: school?.name || '',
      country: school?.country || '',
      city: school?.city || '',
      address: school?.address || '',
      website: school?.website || '',
      contact_email: school?.contact_email || '',
      contact_phone: school?.contact_phone || '',
      partnership_status: school?.partnership_status || 'active',
      description: school?.description || '',
    },
  })

  const partnershipStatus = watch('partnership_status')

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateFile(file, ['image/jpeg', 'image/png', 'image/webp'], 5)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleFormSubmit = async (data: SchoolFormData) => {
    try {
      let logoUrl = school?.logo_url || null

      // Upload new logo if selected
      if (logoFile && school) {
        const uploadedUrl = await uploadFile(logoFile, 'school-logos', school.id)
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        }
      } else if (logoFile && !school) {
        // For new schools, we'll need to update after creation
        // This is a limitation - logo will be added in a second step
      }

      if (isEditing && school) {
        await updateSchoolMutation.mutateAsync({
          id: school.id,
          data: {
            name: data.name,
            country: data.country,
            city: data.city || null,
            address: data.address || null,
            website: data.website || null,
            contact_email: data.contact_email || null,
            contact_phone: data.contact_phone || null,
            partnership_status: data.partnership_status,
            description: data.description || null,
            logo_url: logoUrl,
          },
        })
      } else {
        const newSchool = await createSchoolMutation.mutateAsync({
          name: data.name,
          country: data.country,
          city: data.city || null,
          address: data.address || null,
          website: data.website || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          partnership_status: data.partnership_status,
          description: data.description || null,
          logo_url: logoUrl,
        })

        // If logo was selected for new school, upload it now
        if (logoFile && newSchool) {
          const uploadedUrl = await uploadFile(logoFile, 'school-logos', newSchool.id)
          if (uploadedUrl) {
            await updateSchoolMutation.mutateAsync({
              id: newSchool.id,
              data: { logo_url: uploadedUrl },
            })
          }
        }
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save school:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-6xl md:max-w-7xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isEditing ? 'Edit School/Partner' : 'Add New School/Partner'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {isEditing
                ? 'Update school or partner information'
                : 'Create a new school or partner profile'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {/* Form Content */}
        <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Logo Upload Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-primary" />
                  School Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain rounded-lg border bg-white"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 5MB. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <div className="space-y-2 sm:col-span-2 md:col-span-3">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      School Name *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Harvard University"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Country *
                    </Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      City
                    </Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Boston"
                    />
                  </div>

                  {/* Partnership Status */}
                  <div className="space-y-2">
                    <Label htmlFor="partnership_status" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Partnership Status
                    </Label>
                    <Select
                      value={partnershipStatus}
                      onValueChange={(value) => setValue('partnership_status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang Hợp Tác</SelectItem>
                        <SelectItem value="inactive">Ngừng Hợp Tác</SelectItem>
                        <SelectItem value="pending">Chờ Duyệt</SelectItem>
                        <SelectItem value="terminated">Đã Chấm Dứt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address */}
                  <div className="space-y-2 sm:col-span-2 md:col-span-3">
                    <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      {...register('address')}
                      placeholder="Full street address..."
                      rows={2}
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Website
                    </Label>
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://example.edu"
                    />
                    {errors.website && (
                      <p className="text-sm text-destructive">{errors.website.message}</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contact Email
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      {...register('contact_email')}
                      placeholder="admissions@school.edu"
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contact Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      {...register('contact_phone')}
                      placeholder="+1234567890"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 sm:col-span-2 md:col-span-3">
                    <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Brief description about the school or partnership..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </ScrollArea>

        <Separator />

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-background">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
