import { cn } from '@/lib/utils'
import { CalendarClock, Home, Settings, WalletCards } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/recurring', label: 'Recurrentes', icon: CalendarClock },
  { to: '/subscriptions', label: 'Sus', icon: WalletCards },
  { to: '/settings', label: 'Config', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const activeIndex = Math.max(0, items.findIndex((item) => location.pathname.startsWith(item.to)))

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-gray-200/80 bg-white/95 p-1.5 shadow-[0_-10px_40px_rgba(17,24,39,0.12)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#171715]/95">
        <span
          aria-hidden
          className="absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/4)] rounded-xl bg-[#1a1a18] shadow-sm transition-transform duration-300 ease-out dark:bg-white"
          style={{ transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))` }}
        />
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'relative z-10 flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors duration-300',
              isActive
                ? 'text-white dark:text-[#1a1a18]'
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
