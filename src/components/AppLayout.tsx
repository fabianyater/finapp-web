import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { useThemeStore, type ThemeMode } from '@/store/theme'

export default function AppLayout() {
  const { setMode } = useThemeStore()
  const { data: profile } = useQuery({ queryKey: ['user', 'me'], queryFn: usersApi.getMe })

  useEffect(() => {
    if (profile?.preferences?.theme) {
      setMode(profile.preferences.theme as ThemeMode)
    }
  }, [profile, setMode])

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8] dark:bg-[#111110]">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
