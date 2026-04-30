import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/ui/Toaster'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import AccountsPage from '@/pages/accounts/AccountsPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import RecurringTransactionsPage from '@/pages/recurring/RecurringTransactionsPage'
import BudgetsPage from '@/pages/budgets/BudgetsPage'
import TagsPage from '@/pages/tags/TagsPage'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PageHeader from '@/components/PageHeader'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
<Route path="/recurring" element={<RecurringTransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
