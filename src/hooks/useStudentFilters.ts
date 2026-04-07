'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export interface StudentFilterState {
  search: string
  status: string
  stage: string
  country: string
  counselorId: string
  gpaMin?: number
  gpaMax?: number
  dateFrom?: string
  dateTo?: string
}

export interface SavedView {
  id: string
  name: string
  filters: Partial<StudentFilterState>
  createdAt: string
  isShared?: boolean
  sharedBy?: string
}

export interface FilterErrors {
  gpaMin?: string
  gpaMax?: string
  dateRange?: string
}

const STORAGE_KEY = 'student-views'
const DEBOUNCE_DELAY = 300 // ms

const defaultFilters: StudentFilterState = {
  search: '',
  status: 'all',
  stage: 'all',
  country: 'all',
  counselorId: 'all',
  gpaMin: undefined,
  gpaMax: undefined,
  dateFrom: undefined,
  dateTo: undefined,
}

/**
 * Hook for advanced student filtering with saved views and URL state management
 */
export function useStudentFilters(
  initialFilters?: Partial<StudentFilterState>,
  urlParams?: URLSearchParams
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize filters from URL params or defaults
  const initializeFilters = useCallback(() => {
    if (urlParams) {
      return {
        ...defaultFilters,
        search: urlParams.get('search') || '',
        status: urlParams.get('status') || 'all',
        stage: urlParams.get('stage') || 'all',
        country: urlParams.get('country') || 'all',
        counselorId: urlParams.get('counselorId') || 'all',
        gpaMin: urlParams.get('gpaMin')
          ? parseFloat(urlParams.get('gpaMin')!)
          : undefined,
        gpaMax: urlParams.get('gpaMax')
          ? parseFloat(urlParams.get('gpaMax')!)
          : undefined,
        dateFrom: urlParams.get('dateFrom') || undefined,
        dateTo: urlParams.get('dateTo') || undefined,
      }
    }

    // Fallback to searchParams from Next.js
    const params = searchParams
    return {
      ...defaultFilters,
      ...initialFilters,
      search: params.get('search') || initialFilters?.search || '',
      status: params.get('status') || initialFilters?.status || 'all',
      stage: params.get('stage') || initialFilters?.stage || 'all',
      country: params.get('country') || initialFilters?.country || 'all',
      counselorId:
        params.get('counselorId') || initialFilters?.counselorId || 'all',
      gpaMin: params.get('gpaMin')
        ? parseFloat(params.get('gpaMin')!)
        : initialFilters?.gpaMin,
      gpaMax: params.get('gpaMax')
        ? parseFloat(params.get('gpaMax')!)
        : initialFilters?.gpaMax,
      dateFrom: params.get('dateFrom') || initialFilters?.dateFrom,
      dateTo: params.get('dateTo') || initialFilters?.dateTo,
    }
  }, [initialFilters, urlParams, searchParams])

  const [filters, setFilters] = useState<StudentFilterState>(initializeFilters)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [errors, setErrors] = useState<FilterErrors>({})
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  )

  // Load saved views from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setSavedViews(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load saved views:', error)
      }
    }
  }, [])

  // Validate filters
  const validateFilters = useCallback((newFilters: StudentFilterState) => {
    const newErrors: FilterErrors = {}

    // Validate GPA range
    if (newFilters.gpaMin !== undefined) {
      if (newFilters.gpaMin < 0 || newFilters.gpaMin > 4.0) {
        newErrors.gpaMin = 'GPA must be between 0 and 4.0'
      }
    }

    if (newFilters.gpaMax !== undefined) {
      if (newFilters.gpaMax < 0 || newFilters.gpaMax > 4.0) {
        newErrors.gpaMax = 'GPA must be between 0 and 4.0'
      }
    }

    if (
      newFilters.gpaMin !== undefined &&
      newFilters.gpaMax !== undefined &&
      newFilters.gpaMin > newFilters.gpaMax
    ) {
      newErrors.gpaMin = 'Min GPA cannot be greater than Max GPA'
    }

    // Validate date range
    if (newFilters.dateFrom && newFilters.dateTo) {
      const fromDate = new Date(newFilters.dateFrom)
      const toDate = new Date(newFilters.dateTo)

      if (fromDate > toDate) {
        newErrors.dateRange = 'From date cannot be after To date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [])

  // Update single filter field with debounce
  const updateFilter = useCallback(
    (field: keyof StudentFilterState, value: any) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [field]: value }

        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        // Set new debounce timer to update URL
        const timer = setTimeout(() => {
          updateURLParams(newFilters)
        }, DEBOUNCE_DELAY)

        setDebounceTimer(timer)

        // Validate immediately
        validateFilters(newFilters)

        return newFilters
      })
    },
    [debounceTimer, validateFilters]
  )

  // Update multiple filter fields
  const updateFilters = useCallback(
    (updates: Partial<StudentFilterState>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...updates }

        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        // Set new debounce timer to update URL
        const timer = setTimeout(() => {
          updateURLParams(newFilters)
        }, DEBOUNCE_DELAY)

        setDebounceTimer(timer)

        // Validate immediately
        validateFilters(newFilters)

        return newFilters
      })
    },
    [debounceTimer, validateFilters]
  )

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setErrors({})

    // Clear URL params
    if (typeof window !== 'undefined') {
      router.push(pathname)
    }
  }, [router, pathname])

  // Save current filters as a view
  const saveView = useCallback(
    (name: string) => {
      const newView: SavedView = {
        id: `view-${Date.now()}`,
        name,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      }

      const updatedViews = [...savedViews, newView]
      setSavedViews(updatedViews)

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews))
        } catch (error) {
          console.error('Failed to save view:', error)
        }
      }

      return newView
    },
    [filters, savedViews]
  )

  // Apply a saved view
  const applyView = useCallback((viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    if (view) {
      setFilters({ ...defaultFilters, ...view.filters })
      updateURLParams({ ...defaultFilters, ...view.filters })
    }
  }, [savedViews])

  // Delete a saved view
  const deleteView = useCallback(
    (viewId: string) => {
      const updatedViews = savedViews.filter((v) => v.id !== viewId)
      setSavedViews(updatedViews)

      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews))
        } catch (error) {
          console.error('Failed to delete view:', error)
        }
      }
    },
    [savedViews]
  )

  // Get current filters as URL params
  const getURLParams = useCallback(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        params.set(key, String(value))
      }
    })

    return params
  }, [filters])

  // Update URL with current filters
  const updateURLParams = useCallback(
    (filterState: StudentFilterState) => {
      if (typeof window === 'undefined') return

      const params = new URLSearchParams()

      Object.entries(filterState).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          params.set(key, String(value))
        }
      })

      const queryString = params.toString()
      const newPath = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(newPath, { scroll: false })
    },
    [pathname, router]
  )

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.stage !== 'all' ||
      filters.country !== 'all' ||
      filters.counselorId !== 'all' ||
      filters.gpaMin !== undefined ||
      filters.gpaMax !== undefined ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined
    )
  }, [filters])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    filters,
    errors,
    savedViews,
    updateFilter,
    updateFilters,
    resetFilters,
    saveView,
    applyView,
    deleteView,
    getURLParams,
    hasActiveFilters,
  }
}
