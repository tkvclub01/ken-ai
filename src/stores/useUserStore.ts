import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'
import { User } from '@supabase/supabase-js'

interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
  }
}

interface UserState {
  user: User | null
  preferences: UserPreferences
  setUser: (user: User | null) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  clear: () => void
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
  },
}

/**
 * Zustand store for user preferences only
 * Note: User profile and permissions are now managed by React Query
 * This store is kept for UI preferences that don't need server sync
 */
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      preferences: defaultPreferences,
      setUser: (user) => set({ user }),
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      clear: () => set({ user: null, preferences: defaultPreferences }),
    }),
    {
      name: STORAGE_KEYS.userPreferences,
      partialize: (state) => ({ preferences: state.preferences }), // Only persist preferences, not auth state
    }
  )
)
