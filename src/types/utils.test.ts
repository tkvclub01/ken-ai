/**
 * Sample Tests for Type Utilities
 */

import {
  isStudent,
  isValidStudentStatus,
  safeJsonParse,
  filterNonNull,
  createRecord,
} from '@/types/utils'
import type { Student } from '@/types'

describe('Type Guards', () => {
  const validStudent: Student = {
    id: '123',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '123456789',
    current_stage: 'lead',
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    date_of_birth: null,
    nationality: null,
    target_country: null,
    target_school: null,
    counselor_id: null,
  }

  describe('isStudent', () => {
    it('should return true for valid student object', () => {
      expect(isStudent(validStudent)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isStudent(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isStudent(undefined)).toBe(false)
    })

    it('should return false for invalid object', () => {
      expect(isStudent({ name: 'John' })).toBe(false)
    })

    it('should return false for string', () => {
      expect(isStudent('student')).toBe(false)
    })
  })

  describe('isValidStudentStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isValidStudentStatus('lead')).toBe(true)
      expect(isValidStudentStatus('active')).toBe(true)
      expect(isValidStudentStatus('inactive')).toBe(true)
      expect(isValidStudentStatus('completed')).toBe(true)
    })

    it('should return false for invalid statuses', () => {
      expect(isValidStudentStatus('invalid')).toBe(false)
      expect(isValidStudentStatus('')).toBe(false)
    })
  })
})

describe('Helper Functions', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse<{ name: string }>('{"name": "John"}', { name: 'Default' })
      expect(result).toEqual({ name: 'John' })
    })

    it('should return fallback for invalid JSON', () => {
      const result = safeJsonParse<{ name: string }>('invalid', { name: 'Default' })
      expect(result).toEqual({ name: 'Default' })
    })

    it('should return fallback for empty string', () => {
      const result = safeJsonParse<string>('', 'fallback')
      expect(result).toBe('fallback')
    })
  })

  describe('filterNonNull', () => {
    it('should filter out null and undefined values', () => {
      const input = [1, null, 2, undefined, 3, null]
      const result = filterNonNull(input)
      expect(result).toEqual([1, 2, 3])
    })

    it('should return empty array for all null/undefined', () => {
      const input = [null, undefined, null]
      const result = filterNonNull(input)
      expect(result).toEqual([])
    })

    it('should return same array if no null/undefined', () => {
      const input = [1, 2, 3]
      const result = filterNonNull(input)
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('createRecord', () => {
    it('should create record with default values', () => {
      const result = createRecord(['a', 'b', 'c'], 0)
      expect(result).toEqual({ a: 0, b: 0, c: 0 })
    })

    it('should work with string values', () => {
      const result = createRecord(['x', 'y'], 'default')
      expect(result).toEqual({ x: 'default', y: 'default' })
    })

    it('should work with object values', () => {
      const defaultValue = { count: 0 }
      const result = createRecord(['item1', 'item2'], defaultValue)
      expect(result).toEqual({
        item1: { count: 0 },
        item2: { count: 0 },
      })
    })
  })
})
