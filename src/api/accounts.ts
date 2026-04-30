import { apiClient } from './client'

export interface AccountDto {
  id: string
  name: string
  type: 'CASH' | 'BANK' | 'CREDIT_CARD'
  initialBalance: number
  currentBalance: number
  currency: string
  icon?: string
  color?: string
  isDefault: boolean
  isArchived: boolean
  excludeFromTotal: boolean
}

export interface PagedAccountResponse {
  data: AccountDto[]
  meta: {
    currentPage: number
    pageSize: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface CreateAccountRequest {
  name: string
  type: string
  initialBalance: number
  icon: string
  color: string
  currency: string
}

export interface UpdateAccountRequest {
  accountId: string
  name: string
  type: string
  initialBalance: number
  icon: string
  color: string
  defaultAccount: boolean
  excludeFromTotal: boolean
}

export interface MemberDto {
  userId: string
  email: string
  name: string
  joinedAt: string
}

export const accountsApi = {
  list: () =>
    apiClient
      .get<PagedAccountResponse>('/accounts', { params: { size: 100 } })
      .then((r) => r.data),

  create: (data: CreateAccountRequest) =>
    apiClient.post('/accounts', data).then((r) => r.data),

  update: (id: string, data: Omit<UpdateAccountRequest, 'accountId'>) =>
    apiClient.put(`/accounts/${id}`, { accountId: id, ...data }).then((r) => r.data),

  archive: (id: string, excludeFromTotal: boolean) =>
    apiClient.patch(`/accounts/${id}/archive`, { excludeFromTotal }).then((r) => r.data),

  unarchive: (id: string) =>
    apiClient.patch(`/accounts/${id}/unarchive`).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/accounts/${id}`).then((r) => r.data),

  listMembers: (accountId: string) =>
    apiClient.get<MemberDto[]>(`/accounts/${accountId}/members`).then((r) => r.data),

  inviteMember: (accountId: string, email: string) =>
    apiClient.post(`/accounts/${accountId}/members`, { email }),

  removeMember: (accountId: string, userId: string) =>
    apiClient.delete(`/accounts/${accountId}/members/${userId}`),
}
