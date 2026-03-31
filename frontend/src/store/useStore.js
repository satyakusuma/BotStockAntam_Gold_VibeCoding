import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (user) => set({ user }),

      // UI
      sidebarOpen: true,
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      // Notifications
      notifications: [],
      addNotification: (notif) => set(s => ({
        notifications: [{ id: Date.now(), ...notif }, ...s.notifications].slice(0, 50)
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'gold-asset-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
