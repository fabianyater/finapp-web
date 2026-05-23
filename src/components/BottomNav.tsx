import { cn } from "@/lib/utils";
import { CalendarClock, Home, Settings, WalletCards } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Inicio", icon: Home, slot: 0 },
  { to: "/recurring", label: "Recurrentes", icon: CalendarClock, slot: 1 },
  { to: "/subscriptions", label: "Suscripciones", icon: WalletCards, slot: 3 },
  { to: "/settings", label: "Configuración", icon: Settings, slot: 4 },
];

export default function BottomNav({
  reserveCreateSlot,
}: {
  reserveCreateSlot: boolean;
}) {
  const location = useLocation();
  const activeIndex = items.findIndex((item) =>
    location.pathname.startsWith(item.to),
  );
  const activeSlot =
    activeIndex < 0
      ? 0
      : reserveCreateSlot
        ? items[activeIndex].slot
        : activeIndex;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={cn(
          "pointer-events-auto relative mx-auto grid max-w-md gap-1 rounded-3xl border border-white/80 bg-white/95 p-1.5 shadow-[0_-16px_46px_rgba(32,28,24,0.16),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur dark:border-[#2a2a28] dark:bg-[#171715]/95 dark:shadow-[0_-16px_46px_rgba(0,0,0,0.32)]",
          reserveCreateSlot ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        <span
          aria-hidden
          className="absolute bottom-1.5 left-1.5 top-1.5 rounded-2xl bg-emerald-700 shadow-sm transition-[transform,width] duration-300 ease-out dark:bg-white"
          style={{
            width: reserveCreateSlot
              ? "calc((100% - 1.75rem) / 5)"
              : "calc((100% - 1.5rem) / 4)",
            transform: `translateX(calc(${activeSlot} * (100% + 0.25rem)))`,
          }}
        />
        {reserveCreateSlot && (
          <span aria-hidden className="col-start-3 row-start-1" />
        )}
        {items.map(({ to, label, icon: Icon, slot }, index) => (
          <NavLink
            key={to}
            to={to}
            style={{
              gridColumnStart: (reserveCreateSlot ? slot : index) + 1,
            }}
            className={({ isActive }) =>
              cn(
                "relative z-10 row-start-1 flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition-colors duration-300",
                isActive
                  ? "text-white dark:text-[#1a1a18]"
                  : "cursor-pointer text-gray-400 dark:text-gray-500",
              )
            }
          >
            <Icon size={17} strokeWidth={2.1} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
