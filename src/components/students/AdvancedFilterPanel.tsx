'use client'

import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useStudentFilters, type SavedView } from '@/hooks/useStudentFilters'
import { cn, formatDate } from '@/lib/utils'
import {
  Filter,
  Save,
  Trash2,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react'

interface AdvancedFilterPanelProps {
  onApplyFilters?: (filters: any) => void
}

export function AdvancedFilterPanel({
  onApplyFilters,
}: AdvancedFilterPanelProps) {
  const {
    filters,
    errors,
    savedViews,
    updateFilter,
    updateFilters,
    resetFilters,
    saveView,
    applyView,
    deleteView,
    hasActiveFilters,
  } = useStudentFilters()

  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  const handleSaveView = () => {
    if (newViewName.trim()) {
      saveView(newViewName.trim())
      setNewViewName('')
      setSaveViewDialogOpen(false)
    }
  }

  const handleReset = () => {
    resetFilters()
    onApplyFilters?.(filters)
  }

  const handleApplyView = (viewId: string) => {
    applyView(viewId)
    onApplyFilters?.(filters)
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your student search with advanced criteria
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Saved Views */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Saved Views</Label>
              <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save Current
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter View</DialogTitle>
                    <DialogDescription>
                      Give your current filter combination a name
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="e.g., Active Australian Students"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveView()
                    }}
                  />
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSaveViewDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveView}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {savedViews.length > 0 ? (
              <div className="space-y-2">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between p-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => handleApplyView(view.id)}
                      className="flex-1 text-left text-sm"
                    >
                      {view.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteView(view.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No saved views yet. Save your current filters to reuse them later.
              </p>
            )}
          </div>

          <Separator />

          {/* Basic Filters */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Basic Filters</Label>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or passport..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Pipeline Stage</Label>
                <Select
                  value={filters.stage}
                  onValueChange={(value) => updateFilter('stage', value)}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="departed">Departed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Target Country</Label>
              <Select
                value={filters.country}
                onValueChange={(value) => updateFilter('country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="New Zealand">New Zealand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* GPA Range */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">GPA Range</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gpaMin">Min GPA</Label>
                <Input
                  id="gpaMin"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.0"
                  placeholder="0.0"
                  value={filters.gpaMin || ''}
                  onChange={(e) =>
                    updateFilter(
                      'gpaMin',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className={cn(errors.gpaMin && 'border-destructive')}
                />
                {errors.gpaMin && (
                  <p className="text-xs text-destructive">{errors.gpaMin}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpaMax">Max GPA</Label>
                <Input
                  id="gpaMax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.0"
                  placeholder="4.0"
                  value={filters.gpaMax || ''}
                  onChange={(e) =>
                    updateFilter(
                      'gpaMax',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className={cn(errors.gpaMax && 'border-destructive')}
                />
                {errors.gpaMax && (
                  <p className="text-xs text-destructive">{errors.gpaMax}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Date Range</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
                  onChange={(e) =>
                    updateFilter(
                      'dateFrom',
                      e.target.value ? new Date(e.target.value).toISOString() : undefined
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
                  onChange={(e) =>
                    updateFilter(
                      'dateTo',
                      e.target.value ? new Date(e.target.value).toISOString() : undefined
                    )
                  }
                />
              </div>
            </div>

            {errors.dateRange && (
              <p className="text-xs text-destructive">{errors.dateRange}</p>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={() => onApplyFilters?.(filters)}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
