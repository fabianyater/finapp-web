import type { AdminMetrics } from '@/types'
import { apiClient } from './client'

export const adminApi = {
  getMetrics: () =>
    apiClient.get<AdminMetrics>('/admin/metrics').then((response) => response.data),
}
