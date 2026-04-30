import type { NotificationItem } from '@/types'
import { apiClient } from './client'

export const notificationsApi = {
  getRecent: (limit = 50) =>
    apiClient.get<NotificationItem[]>('/notifications', { params: { limit } }).then((r) => r.data),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    apiClient.post('/notifications/read-all').then((r) => r.data),
}
