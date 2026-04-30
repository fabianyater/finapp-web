import { apiClient } from './client'

export interface ParseTransactionResponse {
  type: 'EXPENSE' | 'INCOME'
  amount: number
  description: string
  note: string | null
  occurredOn: string
  categoryId: string | null
  newCategory: { name: string; icon: string; color: string } | null
}

export interface DeletedTransactionDto {
  id: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  description: string
  note?: string
  occurredOn: string
  deletedAt: string
  categoryId: string | null
  accountId: string
  toAccountId?: string | null
}

export interface TransactionListDto {
  id: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  description: string
  note?: string
  occurredOn: string
  accountId: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  categoryIcon: string | null
  toAccountId?: string | null
  tags?: string[]
  createdBy?: string | null
}

export interface PagedTransactionResponse {
  data: TransactionListDto[]
  meta: {
    currentPage: number
    pageSize: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export const transactionsApi = {
  list: (params?: {
    accountIds?: string[]
    categoryIds?: string[]
    page?: number
    size?: number
    sortBy?: string
    direction?: 'ASC' | 'DESC'
    dateFrom?: string
    dateTo?: string
    search?: string
    types?: string[]
    tags?: string[]
  }) =>
    apiClient
      .get<PagedTransactionResponse>('/accounts/transactions', {
        params: {
          accountIds: params?.accountIds,
          categoryIds: params?.categoryIds,
          page: params?.page ?? 0,
          size: params?.size ?? 100,
          sortBy: params?.sortBy ?? 'occurredOn',
          direction: params?.direction ?? 'DESC',
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          search: params?.search,
          types: params?.types,
          tags: params?.tags,
        },
      })
      .then((r) => r.data),

  listTags: () =>
    apiClient.get<string[]>('/accounts/transactions/tags').then((r) => r.data),

  renameTag: (tag: string, newName: string) =>
    apiClient.put(`/accounts/transactions/tags/${encodeURIComponent(tag)}`, { newName }),

  deleteTag: (tag: string) =>
    apiClient.delete(`/accounts/transactions/tags/${encodeURIComponent(tag)}`),

  create: (
    accountId: string,
    data: {
      categoryId: string
      type: 'EXPENSE' | 'INCOME'
      amount: number
      description: string
      note?: string
      occurredOn: string
      tags?: string[]
    },
  ) =>
    apiClient.post<string>(`/accounts/${accountId}/transactions`, data).then((r) => r.data),

  update: (
    accountId: string,
    transactionId: string,
    data: {
      type: string
      amount: number
      description: string
      note?: string
      occurredOn: string
      categoryId: string
      tags?: string[]
    },
  ) =>
    apiClient.put(`/accounts/${accountId}/transactions/${transactionId}`, data),

  remove: (accountId: string, transactionId: string) =>
    apiClient.delete(`/accounts/${accountId}/transactions/${transactionId}`),

  removeTransfer: (accountId: string, transactionId: string) =>
    apiClient.delete(`/accounts/${accountId}/transactions/${transactionId}/transfer`),

  listDeleted: (accountId: string) =>
    apiClient.get<DeletedTransactionDto[]>(`/accounts/${accountId}/transactions/deleted`).then((r) => r.data),

  restore: (accountId: string, transactionId: string) =>
    apiClient.post(`/accounts/${accountId}/transactions/${transactionId}/restore`),

  parseTransaction: (text: string) =>
    apiClient.post<ParseTransactionResponse>('/transactions/parse', { text }).then((r) => r.data),

  createTransfer: (data: {
    fromAccountId: string
    toAccountId: string
    amount: number
    description?: string
    note?: string
    occurredOn: string
  }) =>
    apiClient
      .post<{ outTransactionId: string; inTransactionId: string }>('/transfers', data)
      .then((r) => r.data),

  exportCsv: (params?: {
    accountIds?: string[]
    categoryIds?: string[]
    types?: string[]
    search?: string
    dateFrom?: string
    dateTo?: string
  }) =>
    apiClient
      .get<Blob>('/accounts/transactions/export', {
        params,
        responseType: 'blob',
      })
      .then((r) => r.data),
}
