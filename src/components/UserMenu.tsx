import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, LogOut } from 'lucide-react'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/store/auth'

export default function UserMenu() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { data: profile } = useQuery({ queryKey: ['user', 'me'], queryFn: usersApi.getMe })
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = profile
    ? `${profile.name?.[0] ?? ''}${profile.surname?.[0] ?? ''}`.toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-950/60 transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2a2a28]">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {profile ? `${profile.name} ${profile.surname}` : '—'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {profile?.email ?? '—'}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); navigate('/profile') }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
            >
              <User size={15} />
              Perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
