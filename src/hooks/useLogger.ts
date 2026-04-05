'use client'

import { useCallback } from 'react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  prefix?: string
  minLevel?: LogLevel
  enabled?: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Custom logging hook với environment awareness
 * 
 * Features:
 * - Environment-based log filtering (dev vs prod)
 * - Configurable log levels
 * - Prefix support for easy filtering
 * - Automatic suppression in production (optional)
 * 
 * @example
 * ```tsx
 * const logger = useLogger({ prefix: '[Students]' })
 * 
 * useEffect(() => {
 *   logger.info('Component mounted')
 *   logger.debug('Props:', props)
 * }, [])
 * 
 * const handleFetch = async () => {
 *   try {
 *     logger.info('Fetching students...')
 *     const data = await fetchStudents()
 *     logger.info('Fetched', data.length, 'students')
 *   } catch (error) {
 *     logger.error('Failed to fetch', error)
 *   }
 * }
 * ```
 */
export function useLogger(options: LoggerOptions = {}) {
  const {
    prefix = '',
    minLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enabled = true,
  } = options

  const shouldLog = useCallback(
    (level: LogLevel) => {
      if (!enabled) return false
      
      // In production, only log warnings and errors by default
      if (process.env.NODE_ENV === 'production' && minLevel === 'warn') {
        return level === 'warn' || level === 'error'
      }
      
      return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
    },
    [enabled, minLevel]
  )

  const log = useCallback(
    (level: LogLevel, ...args: any[]) => {
      if (!shouldLog(level)) return

      const timestamp = new Date().toISOString()
      const message = prefix ? `[${prefix}]` : ''
      
      switch (level) {
        case 'debug':
          console.debug(timestamp, message, ...args)
          break
        case 'info':
          console.info(timestamp, message, ...args)
          break
        case 'warn':
          console.warn(timestamp, message, ...args)
          break
        case 'error':
          console.error(timestamp, message, ...args)
          break
      }
    },
    [prefix, shouldLog]
  )

  return {
    debug: (...args: any[]) => log('debug', ...args),
    info: (...args: any[]) => log('info', ...args),
    warn: (...args: any[]) => log('warn', ...args),
    error: (...args: any[]) => log('error', ...args),
    
    // Utility methods
    group: (label: string) => {
      if (shouldLog('debug')) console.group(label)
    },
    groupEnd: () => {
      if (shouldLog('debug')) console.groupEnd()
    },
    table: (data: any) => {
      if (shouldLog('debug')) console.table(data)
    },
  }
}

/**
 * Global logger utility (không cần hook)
 * Sử dụng khi không ở trong React component
 */
export const globalLogger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Global]', ...args)
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Global]', ...args)
    }
  },
  warn: (...args: any[]) => {
    console.warn('[Global]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[Global]', ...args)
  },
}
