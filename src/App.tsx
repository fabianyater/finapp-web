import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/Toaster";
import { queryClient } from "@/lib/queryClient";
import AccountsPage from "@/pages/accounts/AccountsPage";
import AdminMetricsPage from "@/pages/admin/AdminMetricsPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import BudgetsPage from "@/pages/budgets/BudgetsPage";
import CategoriesPage from "@/pages/categories/CategoriesPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import OnboardingPage from "@/pages/onboarding/OnboardingPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import RecurringTransactionsPage from "@/pages/recurring/RecurringTransactionsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import SubscriptionsPage from "@/pages/subscriptions/SubscriptionsPage";
import TagsPage from "@/pages/tags/TagsPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/admin/metrics" element={<AdminMetricsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route
                path="/recurring"
                element={<RecurringTransactionsPage />}
              />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </QueryClientProvider>
  );
}
