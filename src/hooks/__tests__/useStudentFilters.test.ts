import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStudentFilters, type StudentFilterState } from '../useStudentFilters'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useStudentFilters', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with default empty filters', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      expect(result.current.filters).toEqual({
        search: '',
        status: 'all',
        stage: 'all',
        country: 'all',
        counselorId: 'all',
        gpaMin: undefined,
        gpaMax: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      })
    })

    it('should initialize with provided initial filters', () => {
      const initialFilters: Partial<StudentFilterState> = {
        status: 'active',
        country: 'Australia',
      }

      const { result } = renderHook(() => useStudentFilters(initialFilters), {
        wrapper: createWrapper(),
      })

      expect(result.current.filters.status).toBe('active')
      expect(result.current.filters.country).toBe('Australia')
    })
  })

  describe('Filter Updates', () => {
    it('should update single filter field', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.updateFilter('status', 'active')
      })

      expect(result.current.filters.status).toBe('active')
    })

    it('should update multiple filter fields', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.updateFilters({
          status: 'active',
          country: 'USA',
          gpaMin: 3.0,
        })
      })

      expect(result.current.filters.status).toBe('active')
      expect(result.current.filters.country).toBe('USA')
      expect(result.current.filters.gpaMin).toBe(3.0)
    })

    it('should reset all filters to default', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      // Set some filters
      act(() => {
        result.current.updateFilters({
          status: 'active',
          country: 'UK',
          search: 'John',
        })
      })

      // Reset
      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filters.status).toBe('all')
      expect(result.current.filters.country).toBe('all')
      expect(result.current.filters.search).toBe('')
    })
  })

  describe('Saved Views', () => {
    it('should save a view to localStorage', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.updateFilters({
          status: 'active',
          country: 'Australia',
        })
      })

      act(() => {
        result.current.saveView('Active Australian Students')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'student-views',
        expect.any(String)
      )
    })

    it('should load saved views from localStorage', () => {
      const mockViews = [
        {
          id: 'view-1',
          name: 'My View',
          filters: { status: 'active', country: 'USA' },
          createdAt: new Date().toISOString(),
        },
      ]

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockViews))

      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      expect(result.current.savedViews).toHaveLength(1)
      expect(result.current.savedViews[0].name).toBe('My View')
    })

    it('should apply a saved view', () => {
      const mockViews = [
        {
          id: 'view-1',
          name: 'Active Students',
          filters: { status: 'active', stage: 'applied' },
          createdAt: new Date().toISOString(),
        },
      ]

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockViews))

      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.applyView('view-1')
      })

      expect(result.current.filters.status).toBe('active')
      expect(result.current.filters.stage).toBe('applied')
    })

    it('should delete a saved view', () => {
      const mockViews = [
        {
          id: 'view-1',
          name: 'View 1',
          filters: {},
          createdAt: new Date().toISOString(),
        },
        {
          id: 'view-2',
          name: 'View 2',
          filters: {},
          createdAt: new Date().toISOString(),
        },
      ]

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockViews))

      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.deleteView('view-1')
      })

      expect(result.current.savedViews).toHaveLength(1)
      expect(result.current.savedViews[0].id).toBe('view-2')
    })
  })

  describe('URL State Management', () => {
    it('should encode filters to URL params', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.updateFilters({
          status: 'active',
          country: 'USA',
          search: 'John',
        })
      })

      const urlParams = result.current.getURLParams()
      expect(urlParams.get('status')).toBe('active')
      expect(urlParams.get('country')).toBe('USA')
      expect(urlParams.get('search')).toBe('John')
    })

    it('should decode filters from URL params', () => {
      const searchParams = new URLSearchParams({
        status: 'active',
        country: 'UK',
        gpaMin: '3.5',
      })

      const { result } = renderHook(
        () => useStudentFilters(undefined, searchParams),
        {
          wrapper: createWrapper(),
        }
      )

      expect(result.current.filters.status).toBe('active')
      expect(result.current.filters.country).toBe('UK')
      expect(result.current.filters.gpaMin).toBe(3.5)
    })
  })

  describe('Filter Validation', () => {
    it('should validate GPA range', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.updateFilters({
          gpaMin: 4.5, // Invalid: > 4.0
        })
      })

      expect(result.current.errors.gpaMin).toBeDefined()
    })

    it('should validate date range', () => {
      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      const pastDate = new Date('2020-01-01').toISOString()
      const futureDate = new Date('2030-01-01').toISOString()

      act(() => {
        result.current.updateFilters({
          dateFrom: futureDate,
          dateTo: pastDate, // Invalid: dateTo < dateFrom
        })
      })

      expect(result.current.errors.dateRange).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should debounce rapid filter changes', () => {
      jest.useFakeTimers()

      const { result } = renderHook(() => useStudentFilters(), {
        wrapper: createWrapper(),
      })

      // Simulate rapid typing
      act(() => {
        result.current.updateFilter('search', 'J')
        result.current.updateFilter('search', 'Jo')
        result.current.updateFilter('search', 'Joh')
        result.current.updateFilter('search', 'John')
      })

      // Fast-forward timers
      jest.advanceTimersByTime(500)

      // Should only trigger one update after debounce
      expect(result.current.filters.search).toBe('John')

      jest.useRealTimers()
    })
  })
})
