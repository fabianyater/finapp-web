// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
}

export interface RequestPasswordResetRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

// User
export interface CreateUserRequest {
  name: string
  surname: string
  email: string
  password: string
}

export interface UserPreferences {
  currency: string
  language: string
  dateFormat: string
  theme: string
}

export interface UserProfile {
  userId: string
  name: string
  surname: string
  email: string
  preferences: UserPreferences
}

export interface UpdateProfileRequest {
  name?: string
  surname?: string
}

export interface UpdatePreferencesRequest {
  currency?: string
  language?: string
  dateFormat?: string
  theme?: string
}

// Account
export type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD'

export interface Account {
  id: string
  name: string
  type: AccountType
  initialBalance: number
  currentBalance: number
  currency: string
  icon?: string
  color?: string
  isDefault: boolean
  isArchived: boolean
  excludeFromTotal: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  initialBalance: number
  currency?: string
  icon?: string
  color?: string
  isDefault?: boolean
  excludeFromTotal?: boolean
}

// Category
export type CategoryType = 'EXPENSE' | 'INCOME'

export interface Category {
  id: string
  name: string
  type: CategoryType
  color?: string
  icon?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
  color?: string
  icon?: string
}

// Transaction
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  toAccountId?: string | null
  type: TransactionType
  amount: number
  currency: string
  occurredOn: string
  description: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionRequest {
  categoryId: string
  type: 'EXPENSE' | 'INCOME'
  amount: number
  currency?: string
  occurredOn: string
  description: string
  note?: string
}

export interface CreateTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
  note?: string
  occurredOn: string
}

// Recurring Transaction
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringTransaction {
  id: string
  accountId: string
  toAccountId: string | null
  categoryId: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string
  note?: string | null
  frequency: RecurringFrequency
  nextDueDate: string
  lastGeneratedAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRecurringTransactionRequest {
  accountId: string
  toAccountId?: string
  categoryId?: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  description: string
  note?: string
  frequency: RecurringFrequency
  nextDueDate: string
}

export interface UpdateRecurringTransactionRequest {
  accountId: string
  categoryId?: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  description: string
  note?: string
  frequency: RecurringFrequency
  nextDueDate: string
}

// Subscription
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELED'

export interface Subscription {
  id: string
  name: string
  accountId: string
  categoryId: string
  amount: number
  currency: string
  frequency: RecurringFrequency
  nextDueDate: string
  lastPaidDate: string | null
  reminderDaysBefore: number
  autoRenew: boolean
  status: SubscriptionStatus
  createdAt: string
  updatedAt: string
}

export interface SubscriptionRequest {
  name: string
  accountId: string
  categoryId: string
  amount: number
  frequency: RecurringFrequency
  nextDueDate: string
  reminderDaysBefore?: number
  autoRenew?: boolean
}

export interface SubscriptionPayment {
  id: string
  transactionId: string | null
  dueDate: string
  paidDate: string
  amount: number
  currency: string
  createdAt: string
}

export interface RecordSubscriptionPaymentRequest {
  paidDate?: string
  note?: string
}

// Debt
export type DebtDirection = 'I_OWE' | 'OWED_TO_ME'
export type DebtStatus = 'OPEN' | 'PAID' | 'CANCELED'

export interface Debt {
  id: string
  direction: DebtDirection
  counterparty: string
  description: string
  note: string | null
  originalAmount: number
  outstandingAmount: number
  currency: string
  accountId: string | null
  initialTransactionId: string | null
  dueDate: string | null
  status: DebtStatus
  createdAt: string
  updatedAt: string
}

export interface DebtRequest {
  direction: DebtDirection
  counterparty: string
  description: string
  note?: string
  amount: number
  currency?: string
  accountId?: string
  dueDate?: string
}

export interface DebtPayment {
  id: string
  debtId: string
  accountId: string | null
  transactionId: string | null
  amount: number
  currency: string
  paidOn: string
  note: string | null
  createdAt: string
}

export interface DebtPaymentRequest {
  amount: number
  accountId?: string
  paidOn?: string
  note?: string
}

// Notification
export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown>
  unread: boolean
  createdAt: string
}

// Invitation
export interface InvitationItem {
  id: string
  accountId: string
  accountName: string
  inviterName: string
  inviterEmail: string
  createdAt: string
}

// Pagination
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface PageParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  search?: string
}

export interface AdminMetricsTotals {
  users: number
  verifiedUsers: number
  accounts: number
  activeTransactions: number
  deletedTransactions: number
  recurringTransactions: number
  activeRecurringTransactions: number
  subscriptions: number
  activeSubscriptions: number
}

export interface AdminMetricsActivityPoint {
  day: string
  newUsers: number
  transactions: number
}

export interface AdminMetrics {
  generatedAt: string
  totals: AdminMetricsTotals
  activity: AdminMetricsActivityPoint[]
}
