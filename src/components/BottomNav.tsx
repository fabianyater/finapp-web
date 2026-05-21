import { cn } from '@/lib/utils'
import { CalendarClock, Home, Settings, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/recurring', label: 'Recurrentes', icon: CalendarClock },
  { to: '/subscriptions', label: 'Sus', icon: WalletCards },
  { to: '/settings', label: 'Config', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-gray-200/80 bg-white/95 p-1.5 shadow-[0_-10px_40px_rgba(17,24,39,0.12)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#171715]/95">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'bg-[#1a1a18] text-white dark:bg-white dark:text-[#1a1a18]'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-[#252523] dark:hover:text-gray-200',
            )}
          >
            <Icon size={17} strokeWidth={2.1} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
