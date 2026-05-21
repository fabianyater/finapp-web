import type {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
} from '@/types'
import { apiClient } from './client'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: CreateUserRequest) =>
    apiClient.post('/users', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<LoginResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  requestPasswordReset: (data: RequestPasswordResetRequest) =>
    apiClient.post('/auth/password-reset/request', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post('/auth/password-reset', data).then((r) => r.data),
}
