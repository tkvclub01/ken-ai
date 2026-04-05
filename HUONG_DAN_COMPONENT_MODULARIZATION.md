# 🏗️ HƯỚNG DẪN COMPONENT MODULARIZATION

**Ngày:** 2026-04-04  
**Phase:** 4.3 - Component Modularization

---

## 🎯 MỤC TIÊU

Component modularization giúp:
- 📦 **Reusability** - Tái sử dụng components
- 🔧 **Maintainability** - Dễ bảo trì
- 🧪 **Testability** - Dễ test
- 👥 **Team Collaboration** - Nhiều người làm cùng lúc
- 📖 **Readability** - Code dễ đọc

---

## 📐 PRINCIPLES

### 1. Single Responsibility Principle

Mỗi component chỉ làm **MỘT** việc:

```typescript
// ❌ BAD - Component làm quá nhiều việc
function StudentPage() {
  // Fetch data
  // Filter logic
  // Sort logic
  // Display table
  // Display charts
  // Handle pagination
  // Show modals
  return <div>...</div>
}

// ✅ GOOD - Tách thành nhiều components nhỏ
function StudentPage() {
  return (
    <div>
      <StudentFilters onFilter={handleFilter} />
      <StudentTable 
        data={filteredData}
        onSort={handleSort}
      />
      <StudentPagination 
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  )
}
```

---

### 2. Composition Over Inheritance

Sử dụng composition thay vì inheritance:

```typescript
// ❌ BAD - Inheritance
class BaseTable {
  render() { /* ... */ }
}
class StudentTable extends BaseTable { /* ... */ }
class DocumentTable extends BaseTable { /* ... */ }

// ✅ GOOD - Composition
function DataTable({ columns, data, actions }) {
  return (
    <table>
      <TableHeader columns={columns} />
      <TableBody data={data} />
      <TableActions actions={actions} />
    </table>
  )
}

// Reuse với different props
<DataTable columns={studentColumns} data={students} />
<DataTable columns={docColumns} data={documents} />
```

---

### 3. Presentational vs Container Components

Tách logic và UI:

```typescript
// Container Component (Logic)
function StudentListContainer() {
  const { data, isLoading, error } = useStudents()
  const [filter, setFilter] = useState('')
  
  const filteredData = useMemo(() => {
    return data?.filter(s => 
      s.full_name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [data, filter])
  
  return (
    <StudentListView
      data={filteredData}
      isLoading={isLoading}
      error={error}
      filter={filter}
      onFilterChange={setFilter}
    />
  )
}

// Presentational Component (UI only)
function StudentListView({ data, isLoading, error, filter, onFilterChange }) {
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      <SearchInput value={filter} onChange={onFilterChange} />
      <StudentTable data={data} />
    </div>
  )
}
```

---

## 🔨 REFACTORING PATTERNS

### Pattern 1: Extract Sub-Components

#### Before: Monolithic Component

```typescript
// src/app/students/page.tsx (500+ lines)
export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ field: 'name', order: 'asc' })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Fetch logic
  useEffect(() => {
    fetchStudents().then(setStudents).finally(() => setLoading(false))
  }, [])
  
  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.full_name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [students, filter])
  
  // Sort logic
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aVal = a[sortConfig.field]
      const bVal = b[sortConfig.field]
      return sortConfig.order === 'asc' ? aVal > bVal : aVal < bVal
    })
  }, [filteredStudents, sortConfig])
  
  // Pagination logic
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Event handlers
  const handleSort = (field) => { /* ... */ }
  const handlePageChange = (page) => { /* ... */ }
  const handleStudentClick = (student) => { /* ... */ }
  const handleDelete = (id) => { /* ... */ }
  
  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <Button onClick={() => setShowModal(true)}>Add Student</Button>
      </div>
      
      {/* Filters */}
      <div className="mb-4">
        <Input
          placeholder="Search students..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      {/* Table */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')}>Name</TableHead>
              <TableHead onClick={() => handleSort('email')}>Email</TableHead>
              <TableHead onClick={() => handleSort('stage')}>Stage</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <Badge>{student.current_stage}</Badge>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleStudentClick(student)}>View</Button>
                  <Button onClick={() => handleDelete(student.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <Button 
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button 
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      
      {/* Modal */}
      {showModal && (
        <Dialog>
          <StudentForm onClose={() => setShowModal(false)} />
        </Dialog>
      )}
    </div>
  )
}
```

#### After: Modularized Components

```typescript
// src/app/students/page.tsx (50 lines)
import { StudentListContainer } from '@/components/features/students/StudentListContainer'

export default function StudentsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <AddStudentButton />
      </div>
      
      <StudentListContainer />
    </div>
  )
}
```

```typescript
// src/components/features/students/StudentListContainer.tsx
'use client'

import { useState, useMemo } from 'react'
import { useStudents } from '@/hooks/useStudents'
import { StudentFilters } from './StudentFilters'
import { StudentTable } from './StudentTable'
import { StudentPagination } from './StudentPagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function StudentListContainer() {
  const { data: students, isLoading, error } = useStudents()
  const [filter, setFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ field: 'name', order: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  const filteredStudents = useMemo(() => {
    return students?.filter(s => 
      s.full_name.toLowerCase().includes(filter.toLowerCase())
    ) || []
  }, [students, filter])
  
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aVal = a[sortConfig.field]
      const bVal = b[sortConfig.field]
      return sortConfig.order === 'asc' ? aVal > bVal : aVal < bVal
    })
  }, [filteredStudents, sortConfig])
  
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      <StudentFilters 
        filter={filter}
        onFilterChange={setFilter}
        sortConfig={sortConfig}
        onSort={setSortConfig}
      />
      
      <StudentTable 
        data={paginatedStudents}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />
      
      <StudentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
```

```typescript
// src/components/features/students/StudentFilters.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

interface StudentFiltersProps {
  filter: string
  onFilterChange: (value: string) => void
  sortConfig: { field: string; order: 'asc' | 'desc' }
  onSort: (config: { field: string; order: 'asc' | 'desc' }) => void
}

export function StudentFilters({ 
  filter, 
  onFilterChange,
  sortConfig,
  onSort 
}: StudentFiltersProps) {
  const toggleSort = (field: string) => {
    onSort({
      field,
      order: sortConfig.field === field && sortConfig.order === 'asc' 
        ? 'desc' 
        : 'asc'
    })
  }
  
  return (
    <div className="mb-4 space-y-2">
      <Input
        placeholder="Search students..."
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="max-w-md"
      />
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('name')}
        >
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('email')}
        >
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

```typescript
// src/components/features/students/StudentTable.tsx
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash } from 'lucide-react'
import { Student } from '@/types'

interface StudentTableProps {
  data: Student[]
  currentPage: number
  itemsPerPage: number
}

export function StudentTable({ 
  data, 
  currentPage, 
  itemsPerPage 
}: StudentTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students found
      </div>
    )
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(student => (
          <StudentRow 
            key={student.id} 
            student={student}
            startIndex={(currentPage - 1) * itemsPerPage}
          />
        ))}
      </TableBody>
    </Table>
  )
}

function StudentRow({ 
  student, 
  startIndex 
}: { 
  student: Student
  startIndex: number 
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {startIndex + 1}. {student.full_name}
      </TableCell>
      <TableCell>{student.email}</TableCell>
      <TableCell>
        <Badge variant="secondary">{student.current_stage}</Badge>
      </TableCell>
      <TableCell>
        <Badge 
          variant={student.status === 'active' ? 'default' : 'outline'}
        >
          {student.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" title="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Delete">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
```

```typescript
// src/components/features/students/StudentPagination.tsx
'use client'

import { Button } from '@/components/ui/button'

interface StudentPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function StudentPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: StudentPaginationProps) {
  if (totalPages <= 1) return null
  
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  )
}
```

**Benefits:**
- ✅ Mỗi file < 150 dòng
- ✅ Dễ đọc và hiểu
- ✅ Dễ test từng phần
- ✅ Reusable components
- ✅ Multiple developers can work simultaneously

---

### Pattern 2: Extract Custom Hooks

```typescript
// Before: Logic in component
function StudentList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    setLoading(true)
    fetchStudents()
      .then(setStudents)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  
  // ... rest of component
}

// After: Extract to hook
// src/hooks/useStudentList.ts
export function useStudentList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    setLoading(true)
    fetchStudents()
      .then(setStudents)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  
  return { students, loading, error }
}

// Component becomes simpler
function StudentList() {
  const { students, loading, error } = useStudentList()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <StudentTable data={students} />
}
```

---

### Pattern 3: Compound Components

```typescript
// Flexible compound component pattern
function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children }) {
  return <div className="tabs-list">{children}</div>
}

function TabsTrigger({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  
  return (
    <button
      className={activeTab === value ? 'active' : ''}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children }) {
  const { activeTab } = useContext(TabsContext)
  
  if (activeTab !== value) return null
  
  return <div className="tabs-content">{children}</div>
}

// Usage
<Tabs defaultValue="students">
  <TabsList>
    <TabsTrigger value="students">Students</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
  </TabsList>
  
  <TabsContent value="students">
    <StudentList />
  </TabsContent>
  
  <TabsContent value="documents">
    <DocumentList />
  </TabsContent>
</Tabs>
```

---

## 📊 FILE STRUCTURE

### Recommended Structure

```
src/
├── components/
│   ├── ui/                    # Primitive UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── shared/                # Shared components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── ...
│   └── features/              # Feature-specific components
│       ├── students/
│       │   ├── StudentListContainer.tsx
│       │   ├── StudentFilters.tsx
│       │   ├── StudentTable.tsx
│       │   ├── StudentRow.tsx
│       │   ├── StudentPagination.tsx
│       │   └── index.ts       # Barrel export
│       ├── documents/
│       │   ├── DocumentList.tsx
│       │   ├── DocumentUpload.tsx
│       │   └── ...
│       └── knowledge/
│           ├── KnowledgeSearch.tsx
│           └── ...
├── hooks/                     # Custom hooks
│   ├── useStudentList.ts
│   ├── useDocuments.ts
│   └── ...
└── lib/                       # Utilities
    ├── errors.ts
    └── ...
```

### Barrel Exports

```typescript
// src/components/features/students/index.ts
export { StudentListContainer } from './StudentListContainer'
export { StudentFilters } from './StudentFilters'
export { StudentTable } from './StudentTable'
export { StudentPagination } from './StudentPagination'
```

Usage:
```typescript
import { 
  StudentListContainer,
  StudentFilters,
  StudentTable 
} from '@/components/features/students'
```

---

## ✅ MODULARIZATION CHECKLIST

### Identify Candidates
- [ ] Find components > 300 lines
- [ ] Find components with multiple responsibilities
- [ ] Identify duplicated code
- [ ] Look for complex nested JSX

### Plan Refactoring
- [ ] List sub-components to extract
- [ ] Define props interfaces
- [ ] Plan file structure
- [ ] Estimate effort

### Implement
- [ ] Create new component files
- [ ] Extract logic to hooks
- [ ] Update imports
- [ ] Add barrel exports
- [ ] Write tests

### Verify
- [ ] All features still work
- [ ] No console errors
- [ ] Performance not degraded
- [ ] Code coverage maintained

---

## 💡 BEST PRACTICES

### 1. Keep Components Small

**Guideline:**
- Presentational components: < 100 lines
- Container components: < 200 lines
- Complex pages: < 300 lines

### 2. Use TypeScript Interfaces

```typescript
interface ComponentProps {
  data: DataType[]
  loading: boolean
  onError: (error: Error) => void
  onSuccess: (data: DataType) => void
}
```

### 3. One Component Per File

```typescript
// ❌ BAD - Multiple components in one file
export function ComponentA() { }
export function ComponentB() { }

// ✅ GOOD - Separate files
// ComponentA.tsx
export function ComponentA() { }

// ComponentB.tsx
export function ComponentB() { }
```

### 4. Colocate Related Files

```
features/students/
├── StudentList.tsx
├── StudentList.test.tsx
├── StudentList.stories.tsx
└── types.ts
```

---

## 📚 RESOURCES

- **[Component Examples](./src/components/features/students/)** - Real examples
- **[React Patterns](https://reactpatterns.com/)** - Common patterns
- **[Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)** - Advanced pattern

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Ready to implement
