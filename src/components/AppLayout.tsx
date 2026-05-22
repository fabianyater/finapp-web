import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/api/accounts'
import { categoriesApi } from '@/api/categories'
import { usersApi } from '@/api/users'
import { useThemeStore, type ThemeMode } from '@/store/theme'
import CreateActionMenu from '@/pages/dashboard/components/CreateActionMenu'
import AddTransactionModal from '@/pages/dashboard/components/modals/AddTransactionModal'
import TransferModal from '@/pages/dashboard/components/modals/TransferModal'
import BottomNav from './BottomNav'
import { useState } from 'react'

export type AppLayoutContext = {
  setDashboardAccountId: (accountId: string | null) => void
}

export default function AppLayout() {
  const { setMode } = useThemeStore()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['user', 'me'], queryFn: usersApi.getMe })
  const { data: accountsData } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const [showTransaction, setShowTransaction] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [dashboardAccountId, setDashboardAccountId] = useState<string | null>(null)

  const accounts = (accountsData?.data ?? []).filter((account) => !account.isArchived)
  const defaultAccount = accounts.find((account) => account.isDefault) ?? accounts[0]
  const selectedAccount = accounts.find((account) => account.id === dashboardAccountId)
  const movementAccount = selectedAccount ?? defaultAccount
  const isHome = location.pathname === '/dashboard'

  function invalidateMovementData() {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['category-summary'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  useEffect(() => {
    if (profile?.preferences?.theme && !localStorage.getItem('theme')) {
      setMode(profile.preferences.theme as ThemeMode)
    }
  }, [profile, setMode])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f6f1] dark:bg-[#111110]">
      <main className="min-h-0 flex-1 overflow-auto pb-24">
        <Outlet context={{ setDashboardAccountId } satisfies AppLayoutContext} />
      </main>
      <BottomNav reserveCreateSlot={isHome} />
      {isHome && (
        <CreateActionMenu
          canCreateTransaction={!!movementAccount}
          canTransfer={accounts.length >= 2}
          onTransaction={() => setShowTransaction(true)}
          onTransfer={() => setShowTransfer(true)}
        />
      )}
      {showTransaction && movementAccount && (
        <AddTransactionModal
          accountId={movementAccount.id}
          categories={categories}
          initialDescription=""
          currency={movementAccount.currency}
          onClose={() => setShowTransaction(false)}
          onSuccess={() => {
            setShowTransaction(false)
            invalidateMovementData()
          }}
        />
      )}
      {showTransfer && movementAccount && (
        <TransferModal
          accounts={accounts}
          defaultFromAccountId={movementAccount.id}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false)
            invalidateMovementData()
          }}
        />
      )}
    </div>
  )
}
