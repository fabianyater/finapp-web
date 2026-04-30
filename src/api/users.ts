import type { UserProfile, UpdateProfileRequest, UpdatePreferencesRequest } from '@/types'
import { apiClient } from './client'

export const usersApi = {
  getMe: () =>
    apiClient.get<UserProfile>('/users/me').then((r) => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<UserProfile>('/users/me', data).then((r) => r.data),

  updatePreferences: (data: UpdatePreferencesRequest) =>
    apiClient.patch<UserProfile>('/users/me/preferences', data).then((r) => r.data),

  deleteMe: () =>
    apiClient.delete('/users/me').then((r) => r.data),
}
