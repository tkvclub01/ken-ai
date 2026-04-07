import { NavItem } from '@/types'

/**
 * Navigation configuration for sidebar
 */
export const NAVIGATION: NavItem[] = [
  // Management Group
  {
    title: 'Bảng Điều Khiển',
    href: '/',
    icon: 'LayoutDashboard',
    group: 'management',
  },
  {
    title: 'Hồ Sơ',
    href: '/students',
    icon: 'Users',
    group: 'management',
  },
  {
    title: 'Trường / Đối Tác',
    href: '/schools',
    icon: 'BookOpen',
    group: 'management',
  },
  {
    title: 'Tài Liệu',
    href: '/documents',
    icon: 'FileText',
    group: 'management',
  },
  // AI Tools Group
  {
    title: 'Trợ Lý AI',
    href: '/chat',
    icon: 'MessageSquare',
    group: 'ai-tools',
    badge: 'AI',
  },
  {
    title: 'Cơ Sở Kiến Thức',
    href: '/knowledge',
    icon: 'BookOpen',
    group: 'ai-tools',
  },
  // Settings Group
  {
    title: 'Phân Tích',
    href: '/analytics',
    icon: 'BarChart3',
    group: 'settings',
  },
  {
    title: 'Quản Lý Nhân Viên',
    href: '/settings/users',
    icon: 'Users',
    group: 'settings',
    badge: 'Admin',
  },
  {
    title: 'Cài Đặt',
    href: '/settings',
    icon: 'Settings',
    group: 'settings',
  },
]

/**
 * Pipeline stages configuration
 */
export const PIPELINE_STAGES = [
  { id: 'lead', name: 'Tiềm Năng', color: '#6B7280', order: 1 },
  { id: 'applied', name: 'Đã Nộp Đơn', color: '#3B82F6', order: 2 },
  { id: 'interview', name: 'Phỏng Vấn', color: '#F59E0B', order: 3 },
  { id: 'visa', name: 'Xử Lý Visa', color: '#8B5CF6', order: 4 },
  { id: 'departed', name: 'Đã Khởi Hành', color: '#10B981', order: 5 },
  { id: 'completed', name: 'Hoàn Thành', color: '#059669', order: 6 },
]

/**
 * Document types supported
 */
export const DOCUMENT_TYPES = [
  'Hộ Chiếu',
  'Bảng Điểm Học Tập',
  'Chứng Chỉ IELTS/TOEFL',
  'Bài Luận Cá Nhân',
  'Thư Giới Thiệu',
  'Sơ Yếu Lý Lịch',
  'Tài Liệu Tài Chính',
  'Đơn Xin Visa',
  'Thư Mời Nhập Học',
  'Khác',
]

/**
 * Application settings
 */
export const APP_SETTINGS = {
  name: 'KEN AI',
  description: 'Nền Tảng Quản Lý Hồ Sơ Học Sinh Thông Minh',
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
