import { NavItem } from '@/types'

/**
 * Navigation configuration for sidebar
 */
export const NAVIGATION: NavItem[] = [
  // Management Group
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
    group: 'management',
  },
  {
    title: 'Students',
    href: '/students',
    icon: 'Users',
    group: 'management',
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: 'FileText',
    group: 'management',
  },
  // AI Tools Group
  {
    title: 'AI Chat',
    href: '/chat',
    icon: 'MessageSquare',
    group: 'ai-tools',
    badge: 'AI',
  },
  {
    title: 'Knowledge Base',
    href: '/knowledge',
    icon: 'BookOpen',
    group: 'ai-tools',
  },
  // Settings Group
  {
    title: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
    group: 'settings',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    group: 'settings',
  },
]

/**
 * Pipeline stages configuration
 */
export const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: '#6B7280', order: 1 },
  { id: 'applied', name: 'Applied', color: '#3B82F6', order: 2 },
  { id: 'interview', name: 'Interview', color: '#F59E0B', order: 3 },
  { id: 'visa', name: 'Visa Processing', color: '#8B5CF6', order: 4 },
  { id: 'departed', name: 'Departed', color: '#10B981', order: 5 },
  { id: 'completed', name: 'Completed', color: '#059669', order: 6 },
]

/**
 * Document types supported
 */
export const DOCUMENT_TYPES = [
  'Passport',
  'Academic Transcript',
  'IELTS/TOEFL Score',
  'Statement of Purpose',
  'Letter of Recommendation',
  'CV/Resume',
  'Financial Documents',
  'Visa Application',
  'Offer Letter',
  'Other',
]

/**
 * Application settings
 */
export const APP_SETTINGS = {
  name: 'KEN AI',
  description: 'Intelligent Student Management Platform',
  version: '1.0.0',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  search: { key: 'k', modifiers: ['meta'] as const }, // Cmd+K or Ctrl+K
  toggleSidebar: { key: 'b', modifiers: ['meta'] as const },
  newStudent: { key: 'n', modifiers: ['meta'] as const },
  help: { key: '?', modifiers: [] as const },
}

/**
 * Date formats
 */
export const DATE_FORMATS = {
  short: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  withTime: 'MMM d, yyyy h:mm a',
  full: 'EEEE, MMMM d, yyyy h:mm a',
}

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  students: '/api/students',
  documents: '/api/documents',
  chat: '/api/chat',
  knowledge: '/api/knowledge',
  analytics: '/api/analytics',
}

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  theme: 'ken-ai-theme',
  sidebarCollapsed: 'ken-ai-sidebar',
  userPreferences: 'ken-ai-preferences',
}
