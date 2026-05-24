import { apiClient } from './client'
import type { Debt, DebtPayment, DebtPaymentRequest, DebtRequest } from '@/types'

export const debtsApi = {
  list: () => apiClient.get<Debt[]>('/debts').then((r) => r.data),

  create: (data: DebtRequest) =>
    apiClient.post<Debt>('/debts', data).then((r) => r.data),

  recordPayment: (id: string, data: DebtPaymentRequest) =>
    apiClient.post<DebtPayment>(`/debts/${id}/payments`, data).then((r) => r.data),

  listPayments: (id: string) =>
    apiClient.get<DebtPayment[]>(`/debts/${id}/payments`).then((r) => r.data),

  cancel: (id: string) => apiClient.put(`/debts/${id}/cancel`),

  remove: (id: string) => apiClient.delete(`/debts/${id}`),
}
