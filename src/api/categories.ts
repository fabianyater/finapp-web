import { apiClient } from './client'

export interface CategoryDto {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME'
  color?: string
  icon?: string
  createdAt?: string
}

export interface CategoryTemplateDto {
  key: string
  name: string
  type: 'EXPENSE' | 'INCOME'
  color?: string
  icon?: string
}

export interface CategorySummaryDto {
  categoryId: string
  name: string
  color: string
  icon: string
  total: number
}

export const categoriesApi = {
  list: () => apiClient.get<CategoryDto[]>('/categories').then((r) => r.data),
  listDeleted: () => apiClient.get<CategoryDto[]>('/categories/deleted').then((r) => r.data),
  getTemplates: () =>
    apiClient.get<CategoryTemplateDto[]>('/categories/templates').then((r) => r.data),
  setup: (keys: string[]) =>
    apiClient.post<void>('/categories/setup', { keys }).then((r) => r.data),
  getSummary: (accountId: string, type: 'EXPENSE' | 'INCOME', dateFrom?: string, dateTo?: string) =>
    apiClient
      .get<CategorySummaryDto[]>('/categories/summary', { params: { accountId, type, dateFrom, dateTo } })
      .then((r) => r.data),
  create: (data: { name: string; icon: string; color: string; type: string }) =>
    apiClient.post<string>('/categories', data).then((r) => r.data),
  update: (id: string, data: { name: string; icon: string; color: string; type: string }) =>
    apiClient.put(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete(`/categories/${id}`).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post(`/categories/${id}/restore`).then((r) => r.data),
}
