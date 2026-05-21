import { apiClient } from './client'
import type {
  RecordSubscriptionPaymentRequest,
  Subscription,
  SubscriptionPayment,
  SubscriptionRequest,
  SubscriptionStatus,
} from '@/types'

export interface RecordSubscriptionPaymentResult {
  paymentId: string
  transactionId: string
}

export const subscriptionsApi = {
  list: () => apiClient.get<Subscription[]>('/subscriptions').then((r) => r.data),

  create: (data: SubscriptionRequest) =>
    apiClient.post<string>('/subscriptions', data).then((r) => r.data),

  update: (id: string, data: SubscriptionRequest) =>
    apiClient.put(`/subscriptions/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/subscriptions/${id}`),

  changeStatus: (id: string, status: SubscriptionStatus) =>
    apiClient.put(`/subscriptions/${id}/status`, { status }),

  recordPayment: (id: string, data: RecordSubscriptionPaymentRequest) =>
    apiClient
      .post<RecordSubscriptionPaymentResult>(`/subscriptions/${id}/payments`, data)
      .then((r) => r.data),

  listPayments: (id: string) =>
    apiClient.get<SubscriptionPayment[]>(`/subscriptions/${id}/payments`).then((r) => r.data),
}
