import type { InvitationItem } from '@/types'
import { apiClient } from './client'

export const invitationsApi = {
  getPending: () =>
    apiClient.get<InvitationItem[]>('/invitations/pending').then((r) => r.data),
  accept: (id: string) =>
    apiClient.post(`/invitations/${id}/accept`).then((r) => r.data),
  decline: (id: string) =>
    apiClient.post(`/invitations/${id}/decline`).then((r) => r.data),
}
