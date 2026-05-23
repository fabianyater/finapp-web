import { type AccountDto } from "@/api/accounts";
import { useCountingNumber } from "../hooks/useCountingNumber";
import { Eye, EyeOff } from "lucide-react";

export default function TotalBalanceDisplay({
  account,
  balanceVisible,
  onToggleVisible,
}: {
  account: AccountDto;
  balanceVisible: boolean;
  onToggleVisible: () => void;
}) {
  const animatedBalance = useCountingNumber(
    account.currentBalance,
    balanceVisible,
  );

  return (
    <div className="px-1 py-2">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
          Balance actual
        </p>
        <button
          onClick={onToggleVisible}
          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          {balanceVisible ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl font-bold tracking-tight text-gray-700 dark:text-gray-50 tabular-nums">
          {balanceVisible
            ? new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: account.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(animatedBalance)
            : "******"}
        </span>
      </div>
    </div>
  );
}
