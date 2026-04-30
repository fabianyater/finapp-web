import axios from 'axios'
import { queryClient } from '@/lib/queryClient'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  pendingRequests.forEach((cb) => cb(token))
  pendingRequests = []
}

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  queryClient.clear()
  window.location.href = '/login'
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (original._retry) {
      logout()
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      logout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
      const newToken: string = data.accessToken
      const newRefresh: string = data.refreshToken

      localStorage.setItem('access_token', newToken)
      localStorage.setItem('refresh_token', newRefresh)

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      original.headers.Authorization = `Bearer ${newToken}`

      onRefreshed(newToken)
      return apiClient(original)
    } catch {
      logout()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
