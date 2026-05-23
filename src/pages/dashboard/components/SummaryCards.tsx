import { useEffect, useState } from "react";
import { type AccountDto } from "@/api/accounts";
import { cn } from "@/lib/utils";
import { useCountingNumber } from "../hooks/useCountingNumber";
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
  currency,
  onSetCategoryView,
}: {
  selectedAccount: AccountDto | undefined;
  categoryView: "EXPENSE" | "INCOME";
  balanceVisible: boolean;
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
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

  const selectedTotal =
    activeTab === "INCOME"
      ? totalIncome
      : activeTab === "EXPENSE"
        ? totalExpense
        : totalTransfers;
  const animatedSelectedTotal = useCountingNumber(
    selectedTotal,
    balanceVisible,
  );

  if (!selectedAccount) return null;

  const hiddenAmount = "******";
  const activeIndex = TABS.findIndex(({ key }) => key === activeTab);

  const selectedAmount = (() => {
    if (!balanceVisible) return hiddenAmount;
    if (activeTab === "INCOME") return `+${fmt(animatedSelectedTotal, currency)}`;
    if (activeTab === "EXPENSE") return `-${fmt(animatedSelectedTotal, currency)}`;
    return fmt(animatedSelectedTotal, currency);
  })();

  return (
    <div>
      <div className="relative h-11 overflow-hidden rounded-full p-1">
        <div
          className="absolute inset-y-1 left-1 grid w-[calc(100%-0.5rem)] grid-cols-3 gap-1 transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(${1 - activeIndex} * ((100% + 0.5rem) / 3)))`,
          }}
        >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all duration-200 sm:text-xs",
                !isActive
                  ? "text-gray-500 opacity-40 hover:opacity-75 dark:text-gray-400"
                  : "bg-emerald-700 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900",
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span className="min-w-0 truncate">{label}</span>
            </button>
          );
        })}
        </div>
      </div>

      <div className="mt-5 px-1 text-center">
        <p
          className="text-3xl font-bold leading-none tabular-nums text-gray-700 dark:text-gray-100"
        >
          {selectedAmount}
        </p>
      </div>
    </div>
  );
}
