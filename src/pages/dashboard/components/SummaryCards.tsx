import { type AccountDto } from "@/api/accounts";
import { cn } from "@/lib/utils";
import { fmt } from "../utils/formatters";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default function SummaryCards({
  selectedAccount,
  categoryView,
  balanceVisible,
  totalIncome,
  totalExpense,
  balance,
  currency,
  onSetCategoryView,
}: {
  selectedAccount: AccountDto | undefined;
  categoryView: "EXPENSE" | "INCOME";
  balanceVisible: boolean;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
  onSetCategoryView: (v: "EXPENSE" | "INCOME") => void;
}) {
  if (!selectedAccount) return null;

  return (
    <div className="grid grid-cols-3 gap-3 fade-in">
      <button
        type="button"
        onClick={() => onSetCategoryView("INCOME")}
        className={cn(
          "text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-95",
          categoryView === "INCOME"
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-sm"
            : "bg-white dark:bg-[#1a1a18] border-gray-100 dark:border-[#2a2a28] hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-sm hover:-translate-y-px",
        )}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingUp size={12} className="text-emerald-500" />
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            Ingresos
          </span>
        </div>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight tabular-nums">
          {balanceVisible ? fmt(totalIncome, currency) : "••••••"}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSetCategoryView("EXPENSE")}
        className={cn(
          "text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-95",
          categoryView === "EXPENSE"
            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm"
            : "bg-white dark:bg-[#1a1a18] border-gray-100 dark:border-[#2a2a28] hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-sm hover:-translate-y-px",
        )}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingDown size={12} className="text-rose-400" />
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            Gastos
          </span>
        </div>
        <p className="text-sm font-bold text-rose-500 dark:text-rose-400 leading-tight tabular-nums">
          {balanceVisible ? fmt(totalExpense, currency) : "••••••"}
        </p>
      </button>

      <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Wallet size={12} className="text-gray-400 dark:text-gray-500" />
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            Balance
          </span>
        </div>
        <p
          className={cn(
            "text-sm font-bold leading-tight tabular-nums",
            balance >= 0
              ? "text-gray-800 dark:text-gray-100"
              : "text-rose-500 dark:text-rose-400",
          )}
        >
          {balanceVisible ? fmt(balance, currency) : "••••••"}
        </p>
      </div>
    </div>
  );
}
