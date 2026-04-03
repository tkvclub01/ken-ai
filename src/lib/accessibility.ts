/**
 * Accessibility Utilities for KEN AI Dashboard
 * Provides ARIA labels, keyboard navigation helpers, and accessibility constants
 */

export const ARIA_LABELS = {
  // Navigation
  SIDEBAR: 'Main navigation sidebar',
  NAVBAR: 'Top navigation bar',
  BREADCRUMBS: 'Breadcrumb navigation',
  
  // Main Content
  DASHBOARD: 'Dashboard main content',
  STUDENTS: 'Student management section',
  DOCUMENTS: 'Document management section',
  ANALYTICS: 'Analytics and reports section',
  SETTINGS: 'Settings and preferences section',
  
  // Interactive Elements
  COMMAND_PALETTE: 'Command palette - Press Ctrl+K or Cmd+K to open',
  SEARCH: 'Search input',
  NOTIFICATIONS: 'Notifications button',
  USER_MENU: 'User menu dropdown',
  THEME_TOGGLE: 'Theme toggle button',
  
  // Student Management
  KANBAN_BOARD: 'Student pipeline Kanban board',
  STUDENT_TABLE: 'Student data table',
  STUDENT_FORM: 'Student information form',
  
  // Document Management
  UPLOAD_ZONE: 'File upload drag and drop zone',
  DOCUMENT_VIEWER: 'Document preview viewer',
  OCR_PANEL: 'OCR results panel',
  
  // AI Features
  RICH_TEXT_EDITOR: 'Rich text editor with AI assistance',
  CHAT_PANEL: 'AI chat conversation panel',
} as const

export const KEYBOARD_SHORTCUTS = {
  OPEN_COMMAND_PALETTE: ['ctrl+k', 'meta+k'], // Ctrl+K or Cmd+K
  TOGGLE_SIDEBAR: ['ctrl+b', 'meta+b'],
  FOCUS_SEARCH: ['/'],
  SAVE: ['ctrl+s', 'meta+s'],
  UNDO: ['ctrl+z', 'meta+z'],
  REDO: ['ctrl+y', 'meta+shift+z'],
  ESCAPE: ['escape'],
  ENTER: ['enter'],
  TAB: ['tab'],
  SHIFT_TAB: ['shift+tab'],
} as const

export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details',
  'summary',
].join(', ')

export function isFocusableElement(element: Element): boolean {
  return element.matches(FOCUSABLE_SELECTORS)
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[]
}

export function trapFocus(
  container: HTMLElement,
  event: KeyboardEvent
): void {
  if (event.key !== 'Tab') return

  const focusableElements = getFocusableElements(container)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

export function handleKeyboardNavigation(
  event: KeyboardEvent,
  actions: Record<string, () => void>
): void {
  const key = event.key.toLowerCase()
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  Object.entries(actions).forEach(([shortcut, action]) => {
    const keys = shortcut.split('+').map(k => k.toLowerCase())
    const mainKey = keys[keys.length - 1]
    const requiresMeta = keys.includes('meta') || keys.includes('ctrl')
    
    const metaMatch = isMac ? event.metaKey : event.ctrlKey
    
    if (mainKey === key && (!requiresMeta || metaMatch)) {
      event.preventDefault()
      action()
    }
  })
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

export const SKIP_LINKS = {
  MAIN_CONTENT: {
    href: '#main-content',
    label: 'Skip to main content',
  },
  NAVIGATION: {
    href: '#main-navigation',
    label: 'Skip to navigation',
  },
  SEARCH: {
    href: '#search-input',
    label: 'Skip to search',
  },
} as const
