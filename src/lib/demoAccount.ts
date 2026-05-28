const DEMO_ACCOUNT_EMAIL = import.meta.env.VITE_DEMO_ACCOUNT_EMAIL ?? 'demo@finapp.com'

export function isDemoAccount(email?: string | null) {
  return !!email && email.toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase()
}
