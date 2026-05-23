import { useEffect, useRef, useState } from "react";
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

function useCountingNumber(target: number, enabled: boolean) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    const start = valueRef.current;
    const delta = target - start;
    const startTime = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + delta * eased;
      valueRef.current = next;
      setValue(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        valueRef.current = target;
        setValue(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, target]);

  return enabled ? value : target;
}

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

  const selectedTotal =
    activeTab === "INCOME"
      ? totalIncome
      : activeTab === "EXPENSE"
        ? totalExpense
        : totalTransfers;
  const animatedBalance = useCountingNumber(balance, balanceVisible);
  const animatedSelectedTotal = useCountingNumber(
    selectedTotal,
    balanceVisible,
  );

  if (!selectedAccount) return null;

  const hiddenAmount = "******";
  const activeColor =
    activeTab === "INCOME"
      ? "emerald"
      : activeTab === "EXPENSE"
        ? "rose"
        : "blue";

  const selectedAmount = (() => {
    if (!balanceVisible) return hiddenAmount;
    if (activeTab === "INCOME") return `+${fmt(animatedSelectedTotal, currency)}`;
    if (activeTab === "EXPENSE") return `-${fmt(animatedSelectedTotal, currency)}`;
    return fmt(animatedSelectedTotal, currency);
  })();

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 text-[11px] font-semibold shadow-sm transition-all duration-200 sm:text-xs",
                isActive && key === "INCOME"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "",
                isActive && key === "EXPENSE"
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "",
                isActive && key === "TRANSFER"
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "",
                !isActive
                  ? "border-gray-200 bg-white/80 text-gray-500 opacity-55 hover:opacity-80 dark:border-[#343432] dark:bg-[#242421] dark:text-gray-400"
                  : "",
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
          Balance actual
        </p>
        <p
          className={cn(
            "text-[2.15rem] font-bold leading-none tabular-nums sm:text-4xl",
            balance >= 0
              ? "text-gray-900 dark:text-gray-100"
              : "text-rose-500 dark:text-rose-400",
          )}
        >
          {balanceVisible ? fmt(animatedBalance, currency) : hiddenAmount}
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
          {selectedAmount}
        </p>
      </div>
    </div>
  );
}
