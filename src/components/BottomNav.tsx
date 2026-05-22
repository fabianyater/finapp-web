import { cn } from '@/lib/utils'
import { CalendarClock, Home, Settings, WalletCards } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Inicio', icon: Home, slot: 0 },
  { to: '/recurring', label: 'Recurrentes', icon: CalendarClock, slot: 1 },
  { to: '/subscriptions', label: 'Suscripciones', icon: WalletCards, slot: 3 },
  { to: '/settings', label: 'Configuración', icon: Settings, slot: 4 },
]

export default function BottomNav() {
  const location = useLocation()
  const activeSlot = items.find((item) => location.pathname.startsWith(item.to))?.slot ?? 0

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 gap-1 rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-[0_-10px_40px_rgba(16,40,27,0.14)] backdrop-blur dark:border-[#2a2a28] dark:bg-[#171715]/95">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-6 w-[4.25rem] -translate-x-1/2 -translate-y-px rounded-b-3xl bg-[#f3f6f1] dark:bg-[#111110]"
        />
        <span
          aria-hidden
          className="absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-1.75rem)/5)] rounded-xl bg-emerald-700 shadow-sm transition-transform duration-300 ease-out dark:bg-white"
          style={{ transform: `translateX(calc(${activeSlot} * (100% + 0.25rem)))` }}
        />
        <span aria-hidden className="col-start-3 row-start-1" />
        {items.map(({ to, label, icon: Icon, slot }) => (
          <NavLink
            key={to}
            to={to}
            style={{ gridColumnStart: slot + 1 }}
            className={({ isActive }) => cn(
              'relative z-10 row-start-1 flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors duration-300',
              isActive
                ? 'text-white dark:text-[#1a1a18]'
                : 'cursor-pointer text-gray-400 dark:text-gray-500',
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
