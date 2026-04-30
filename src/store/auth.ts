import { create } from 'zustand'
import { queryClient } from '@/lib/queryClient'

interface AuthUser {
  userId: string
  email: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, refreshToken: string, user: AuthUser) => void
  setToken: (token: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  user: (() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })(),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (token, refreshToken, user) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  setToken: (token, refreshToken) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    queryClient.clear()
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
