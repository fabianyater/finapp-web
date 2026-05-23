import { useEffect, useState } from "react";
import { type AccountDto } from "@/api/accounts";
import { cn } from "@/lib/utils";
import { fmt } from "../utils/formatters";
import { TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";

const TABS = [
  { key: "INCOME", label: "Ingresos", icon: TrendingUp },
  { key: "EXPENSE", label: "Gastos", icon: TrendingDown },
  { key: "TRANSFER", label: "Transferencias", icon: ArrowLeftRight },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SummaryCards({
  selectedAccount,
  categoryView,
  balanceVisible,
  totalIncome,
  totalExpense,
  totalTransfers,
  balance,
  currency,
  onSetCategoryView,
}: {
  selectedAccount: AccountDto | undefined;
  categoryView: "EXPENSE" | "INCOME";
  balanceVisible: boolean;
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  balance: number;
  currency: string;
  onSetCategoryView: (v: "EXPENSE" | "INCOME") => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(categoryView);

  useEffect(() => {
    setActiveTab(categoryView);
  }, [categoryView]);

  const handleSelect = (key: TabKey) => {
    setActiveTab(key);
    if (key === "INCOME") onSetCategoryView("INCOME");
    else if (key === "EXPENSE") onSetCategoryView("EXPENSE");
  };

  if (!selectedAccount) return null;

  const hiddenAmount = "••••••";
  const tabAmounts: Record<TabKey, string> = {
    INCOME: balanceVisible ? fmt(totalIncome, currency) : hiddenAmount,
    EXPENSE: balanceVisible ? fmt(totalExpense, currency) : hiddenAmount,
    TRANSFER: balanceVisible ? fmt(totalTransfers, currency) : hiddenAmount,
  };

  const activeIndex = TABS.findIndex(({ key }) => key === activeTab);
  const activeColor =
    activeTab === "INCOME"
      ? "emerald"
      : activeTab === "EXPENSE"
        ? "rose"
        : "blue";

  return (
    <div>
      <div className="relative grid grid-cols-3 gap-1 rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-[#343432] dark:bg-[#242421]">
        <div
          className={cn(
            "absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-full shadow-sm transition-all duration-300 ease-out",
            activeColor === "emerald" ? "bg-emerald-500" : "",
            activeColor === "rose" ? "bg-rose-500" : "",
            activeColor === "blue" ? "bg-blue-500" : "",
          )}
          style={{
            transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
          }}
        />

        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                "relative z-10 flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-semibold transition-colors sm:text-xs",
                isActive
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span className="min-w-0 truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 px-1">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Balance
        </p>
        <p
          className={cn(
            "text-[2.15rem] font-bold leading-none tabular-nums sm:text-4xl",
            balance >= 0
              ? "text-gray-900 dark:text-gray-100"
              : "text-rose-500 dark:text-rose-400",
          )}
        >
          {balanceVisible ? fmt(balance, currency) : hiddenAmount}
        </p>
      </div>

      <div
        className={cn(
          "-mx-4 mt-4 rounded-2xl px-4 py-4 transition-colors",
          activeColor === "emerald"
            ? "bg-emerald-50/80 dark:bg-emerald-950/20"
            : "",
          activeColor === "rose" ? "bg-rose-50/80 dark:bg-rose-950/20" : "",
          activeColor === "blue" ? "bg-blue-50/80 dark:bg-blue-950/20" : "",
        )}
      >
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {activeTab === "INCOME"
            ? "Ingresos totales"
            : activeTab === "EXPENSE"
              ? "Gastos totales"
              : "Transferencias totales"}
        </p>
        <p
          className={cn(
            "text-2xl font-bold leading-tight tabular-nums",
            balanceVisible
              ? activeColor === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : activeColor === "rose"
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-blue-600 dark:text-blue-400"
              : "text-gray-400 dark:text-gray-500",
          )}
        >
          {tabAmounts[activeTab]}
        </p>
      </div>
    </div>
  );
}
