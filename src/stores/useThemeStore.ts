import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      actualTheme: 'light',
      setTheme: (theme: Theme) => {
        set({ theme })
        updateTheme(theme)
      },
      toggleTheme: () => {
        const current = get().theme
        const newTheme: Theme = current === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
        updateTheme(newTheme)
      },
    }),
    {
      name: STORAGE_KEYS.theme,
    }
  )
)

// Helper function to update actual theme
function updateTheme(theme: Theme) {
  const root = document.documentElement
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  let actualTheme: 'light' | 'dark'
  
  if (theme === 'system') {
    actualTheme = systemPrefersDark ? 'dark' : 'light'
  } else {
    actualTheme = theme
  }
  
  // Update the actualTheme in store
  useThemeStore.setState({ actualTheme })
  
  // Apply theme class to document
  root.classList.remove('light', 'dark')
  root.classList.add(actualTheme)
}

// Listen to system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    const currentTheme = useThemeStore.getState().theme
    if (currentTheme === 'system') {
      const newTheme = e.matches ? 'dark' : 'light'
      useThemeStore.setState({ actualTheme: newTheme })
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }
  })
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const storedTheme = useThemeStore.getState().theme
  updateTheme(storedTheme)
}
