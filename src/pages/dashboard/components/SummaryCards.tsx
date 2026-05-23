import { useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleSelect = (key: TabKey) => {
    setActiveTab(key);
    tabRefs.current[key]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
    });
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({
        left: containerRef.current.scrollLeft - 16,
        behavior: "smooth",
      });
    });
    if (key === "INCOME") onSetCategoryView("INCOME");
    else if (key === "EXPENSE") onSetCategoryView("EXPENSE");
  };

  if (!selectedAccount) return null;

  const tabAmounts: Record<TabKey, string> = {
    INCOME: balanceVisible ? fmt(totalIncome, currency) : "••••••",
    EXPENSE: balanceVisible ? fmt(totalExpense, currency) : "••••••",
    TRANSFER: balanceVisible ? fmt(totalTransfers, currency) : "••••••",
  };

  const activeColor =
    activeTab === "INCOME"
      ? "emerald"
      : activeTab === "EXPENSE"
        ? "rose"
        : "blue";

  return (
    <div>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              onClick={() => handleSelect(key)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap flex-shrink-0 transition-all",
                isActive && activeTab === "INCOME"
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "",
                isActive && activeTab === "EXPENSE"
                  ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "",
                isActive && activeTab === "TRANSFER"
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "",
                !isActive
                  ? "border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]"
                  : "",
              )}
            >
              <Icon
                size={15}
                className={
                  isActive
                    ? ""
                    : "text-gray-400 dark:text-gray-500"
                }
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "-mx-4 mt-3 px-4 py-5 rounded-2xl transition-colors",
          activeColor === "emerald"
            ? "bg-emerald-50/80 dark:bg-emerald-950/20"
            : "",
          activeColor === "rose"
            ? "bg-rose-50/80 dark:bg-rose-950/20"
            : "",
          activeColor === "blue"
            ? "bg-blue-50/80 dark:bg-blue-950/20"
            : "",
        )}
      >
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
          {activeTab === "INCOME"
            ? "Ingresos totales"
            : activeTab === "EXPENSE"
              ? "Gastos totales"
              : "Transferencias totales"}
        </p>
        <p
          className={cn(
            "text-3xl font-bold tabular-nums leading-tight",
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

        <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-[#2a2a28]/60">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
            Balance
          </p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums leading-tight",
              balance >= 0
                ? "text-gray-900 dark:text-gray-100"
                : "text-rose-500 dark:text-rose-400",
            )}
          >
            {balanceVisible ? fmt(balance, currency) : "••••••"}
          </p>
        </div>
      </div>
    </div>
  );
}
