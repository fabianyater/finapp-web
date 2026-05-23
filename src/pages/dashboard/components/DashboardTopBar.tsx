import { type AccountDto } from "@/api/accounts";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { resolveColor, resolveIcon } from "../utils/colorUtils";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function DashboardTopBar({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: {
  accounts: AccountDto[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <AccountMenu accounts={accounts} selectedAccountId={selectedAccountId} onSelect={onSelectAccount} />
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <UserMenu />
      </div>
    </div>
  );
}

function AccountMenu({
  accounts,
  selectedAccountId,
  onSelect,
}: {
  accounts: AccountDto[];
  selectedAccountId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = accounts.find((account) => account.id === selectedAccountId);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 min-w-0 max-w-[15rem] items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 text-left shadow-sm transition-colors hover:border-gray-300 dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:hover:border-[#3a3a38]"
      >
        <AccountDot color={selected?.color} icon={selected?.icon} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Cuenta
          </span>
          <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
            {selected?.name ?? "Seleccionar"}
          </span>
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-[#2a2a28] dark:bg-[#1a1a18]">
          <div className="max-h-72 overflow-y-auto">
            {accounts.map((account) => {
              const active = account.id === selectedAccountId;
              return (
                <button
                  key={account.id}
                  onClick={() => {
                    onSelect(account.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors",
                    active
                      ? "bg-gray-100 dark:bg-[#252523]"
                      : "hover:bg-gray-50 dark:hover:bg-[#252523]",
                  )}
                >
                  <AccountDot color={account.color} icon={account.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {account.name}
                    </span>
                    <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
                      {account.currency} · {account.type.replace("_", " ").toLowerCase()}
                    </span>
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>
          <Link
            to="/accounts"
            onClick={() => setOpen(false)}
            className="mt-1 flex h-9 items-center justify-center gap-1.5 rounded-full border border-dashed border-gray-200 text-xs font-semibold text-gray-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-[#3a3a38] dark:text-gray-400"
          >
            <Plus size={13} />
            Gestionar cuentas
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountDot({ color, icon }: { color?: string; icon?: string }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm shadow-sm"
      style={{ backgroundColor: `${resolveColor(color)}24` }}
    >
      {resolveIcon(icon)}
    </span>
  );
}
