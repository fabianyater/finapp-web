import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

function firstValidationError(errors?: Record<string, string[]>) {
  if (!errors) return undefined

  for (const messages of Object.values(errors)) {
    const message = messages.find(Boolean)
    if (message) return message
  }

  return undefined
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<ApiErrorResponse>(error)) return fallback

  const validationMessage = firstValidationError(error.response?.data?.errors)
  const message = error.response?.data?.message?.trim()

  if (message && message !== 'Request validation failed') return message
  if (validationMessage) return validationMessage

  if (!error.response) {
    return 'No pudimos conectar con el servidor. Revisa tu conexion e intenta de nuevo.'
  }

  return fallback
}
