import { type AccountDto } from "@/api/accounts";
import { Eye, EyeOff } from "lucide-react";

export default function TotalBalanceDisplay({
  includedAccounts,
  accounts,
  totalByCurrency,
  balanceVisible,
  onToggleVisible,
}: {
  includedAccounts: AccountDto[];
  accounts: AccountDto[];
  totalByCurrency: Record<string, number>;
  balanceVisible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="px-1 py-2">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
          Saldo total
        </p>
        <button
          onClick={onToggleVisible}
          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          {balanceVisible ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {Object.entries(totalByCurrency).map(([cur, total]) => (
          <span
            key={cur}
            className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 tabular-nums"
          >
            {balanceVisible
              ? new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: cur,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(total)
              : "••••••"}
          </span>
        ))}
      </div>
      {includedAccounts.length < accounts.length && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          {accounts.length - includedAccounts.length} cuenta
          {accounts.length - includedAccounts.length > 1 ? "s" : ""} excluida
          {accounts.length - includedAccounts.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
