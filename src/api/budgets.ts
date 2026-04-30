import { apiClient } from './client'

export interface BudgetDto {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  limitAmount: number
  spentAmount: number
}

export const budgetsApi = {
  list: () => apiClient.get<BudgetDto[]>('/budgets').then((r) => r.data),

  create: (categoryId: string, limitAmount: number) =>
    apiClient.post<string>('/budgets', { categoryId, limitAmount }).then((r) => r.data),

  update: (budgetId: string, limitAmount: number) =>
    apiClient.put(`/budgets/${budgetId}`, { limitAmount }),

  remove: (budgetId: string) => apiClient.delete(`/budgets/${budgetId}`),
}
