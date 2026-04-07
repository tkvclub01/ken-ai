'use client'

import { useState } from 'react'
import { useSchools, useDeleteSchool } from '@/hooks/useSchools'
import { School } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { SchoolDetailModal } from '@/components/features/schools/SchoolDetailModal'
import { SchoolForm } from '@/components/features/schools/SchoolForm'
import { Search, MoreHorizontal, Plus, Eye, Pencil, Trash2, Building2, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { downloadCSV, csvToJSON } from '@/lib/file-utils'

export default function SchoolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null)
  
  // Filter states
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [applicationCountFilter, setApplicationCountFilter] = useState<string>('all')
  
  // Hooks
  const { data: schools = [], isLoading } = useSchools()
  const deleteSchoolMutation = useDeleteSchool()
  
  const handleViewDetails = (school: School) => {
    setSelectedSchool(school)
    setIsDetailOpen(true)
  }

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school)
    setIsFormOpen(true)
  }

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!schoolToDelete) return
    try {
      await deleteSchoolMutation.mutateAsync(schoolToDelete.id)
    } catch (error: any) {
      toast.error('Không thể xóa trường/đối tác', {
        description: error.message || 'Vui lòng thử lại'
      })
    } finally {
      setDeleteDialogOpen(false)
      setSchoolToDelete(null)
    }
  }

  // Export schools to CSV
  const handleExportCSV = () => {
    const exportData = filteredSchools.map(school => ({
      'Tên Trường': school.name,
      'Quốc Gia': school.country,
      'Thành Phố': school.city || '',
      'Địa Chỉ': school.address || '',
      'Website': school.website || '',
      'Email Liên Hệ': school.contact_email || '',
      'Số Điện Thoại': school.contact_phone || '',
      'Trạng Thái Hợp Tác': school.partnership_status,
      'Tổng Đơn Nộp': school.metrics?.totalApplications || 0,
      'Đã Chấp Nhận': school.metrics?.acceptedApplications || 0,
      'Chờ Xử Lý': school.metrics?.pendingApplications || 0,
      'Xử Lý Visa': school.metrics?.visaProcessingApplications || 0,
      'Ngày Tạo': school.created_at,
    }))
    downloadCSV(exportData, `schools_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Xuất CSV thành công')
  }

  // Import schools from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csv = event.target?.result as string
      const data = csvToJSON(csv)
      
      // TODO: Implement bulk import logic here
      toast.info(`Đã đọc ${data.length} dòng từ CSV`, {
        description: 'Tính năng nhập hàng loạt sẽ được triển khai sớm'
      })
    }
    reader.readAsText(file)
  }

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.country.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCountry = countryFilter === 'all' || school.country === countryFilter
    const matchesStatus = statusFilter === 'all' || school.partnership_status === statusFilter

    let matchesApplicationCount = true
    if (applicationCountFilter !== 'all') {
      const totalApps = school.metrics?.totalApplications || 0
      switch (applicationCountFilter) {
        case '0-10':
          matchesApplicationCount = totalApps >= 0 && totalApps <= 10
          break
        case '11-50':
          matchesApplicationCount = totalApps > 10 && totalApps <= 50
          break
        case '50+':
          matchesApplicationCount = totalApps > 50
          break
      }
    }

    return matchesSearch && matchesCountry && matchesStatus && matchesApplicationCount
  })

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(schools.map(s => s.country))).sort()

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trường / Đối Tác</h1>
          <p className="text-muted-foreground">
            Quản lý các trường học và đối tác tuyển sinh
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Trường
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm trường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={countryFilter} onValueChange={(value) => value && setCountryFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Quốc Gia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất Cả Quốc Gia</SelectItem>
            {uniqueCountries.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng Thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
            <SelectItem value="active">Đang Hợp Tác</SelectItem>
            <SelectItem value="inactive">Ngừng Hợp Tác</SelectItem>
            <SelectItem value="pending">Chờ Duyệt</SelectItem>
            <SelectItem value="terminated">Đã Chấm Dứt</SelectItem>
          </SelectContent>
        </Select>

        <Select value={applicationCountFilter} onValueChange={(value) => value && setApplicationCountFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Số Đơn Nộp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất Cả</SelectItem>
            <SelectItem value="0-10">0-10 đơn</SelectItem>
            <SelectItem value="11-50">11-50 đơn</SelectItem>
            <SelectItem value="50+">50+ đơn</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Nhập/Xuất
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <label className="flex items-center w-full cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Nhập CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Schools Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Trường</TableHead>
              <TableHead>Quốc Gia</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Đơn Nộp</TableHead>
              <TableHead className="text-right">Đã Chấp Nhận</TableHead>
              <TableHead className="text-right">Chờ Xử Lý</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-muted-foreground">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSchools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Không tìm thấy trường nào' : 'Chưa có trường/đối tác nào'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.country}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(school.partnership_status)}>
                      {school.partnership_status === 'active' ? 'Đang Hợp Tác' :
                       school.partnership_status === 'inactive' ? 'Ngừng Hợp Tác' :
                       school.partnership_status === 'pending' ? 'Chờ Duyệt' : 'Đã Chấm Dứt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {school.metrics?.totalApplications || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {school.metrics?.acceptedApplications || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {school.metrics?.pendingApplications || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(school)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem Chi Tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSchool(school)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSchool(school)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <SchoolDetailModal
        school={selectedSchool}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditSchool}
      />
      
      <SchoolForm
        school={selectedSchool}
        open={isFormOpen}
        onOpenChange={(open: boolean) => {
          setIsFormOpen(open)
          if (!open) setSelectedSchool(null)
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Trường/Đối Tác?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn{' '}
              <strong>{schoolToDelete?.name}</strong> và tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
