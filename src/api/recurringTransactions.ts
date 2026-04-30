import { apiClient } from './client'
import type {
  RecurringTransaction,
  CreateRecurringTransactionRequest,
  UpdateRecurringTransactionRequest,
} from '@/types'

export const recurringTransactionsApi = {
  list: () =>
    apiClient.get<RecurringTransaction[]>('/recurring-transactions').then((r) => r.data),

  create: (data: CreateRecurringTransactionRequest) =>
    apiClient.post<string>('/recurring-transactions', data).then((r) => r.data),

  update: (id: string, data: UpdateRecurringTransactionRequest) =>
    apiClient.put(`/recurring-transactions/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/recurring-transactions/${id}`),

  toggle: (id: string) =>
    apiClient.post(`/recurring-transactions/${id}/toggle`),
}
