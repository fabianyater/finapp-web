import { type AccountDto } from "@/api/accounts";
import { type CategoryDto } from "@/api/categories";
import { type TransactionListDto } from "@/api/transactions";
import EmptyState from "@/components/EmptyState";
import SkeletonRow from "@/components/SkeletonRow";
import { cn } from "@/lib/utils";
import { iconBg, resolveColor, resolveIcon } from "../../utils/colorUtils";
import { fmt, fmtDate } from "../../utils/formatters";
import { groupByDay, dayTotal } from "../../utils/transactionGrouping";
import { ArrowLeftRight, Receipt } from "lucide-react";

function resolveCat(
  tx: { categoryId?: string | null; categoryName?: string | null; categoryColor?: string | null; categoryIcon?: string | null },
  categoryMap: Map<string, CategoryDto>,
) {
  if (!tx.categoryId) return undefined;
  return (
    categoryMap.get(tx.categoryId) ??
    (tx.categoryName
      ? { name: tx.categoryName, color: tx.categoryColor ?? "#64748b", icon: tx.categoryIcon ?? "tag" }
      : undefined)
  );
}

export default function TransactionList({
  loading,
  txList,
  showAllTxns,
  txTypeFilter,
  txSearch,
  selectedTags,
  selectedCategoryId,
  currency,
  accounts,
  categoryMap,
  onSelectTx,
  onSelectTransferTx,
}: {
  loading: boolean;
  txList: TransactionListDto[];
  showAllTxns: boolean;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  txSearch: string;
  selectedTags: string[];
  selectedCategoryId: string | null;
  currency: string;
  accounts: AccountDto[];
  categoryMap: Map<string, CategoryDto>;
  onSelectTx: (tx: TransactionListDto) => void;
  onSelectTransferTx: (tx: TransactionListDto) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]"
          >
            <SkeletonRow />
          </div>
        ))}
      </div>
    );
  }

  if (txList.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
        <EmptyState
          icon={Receipt}
          title="Sin transacciones"
          sub={
            showAllTxns &&
            (txSearch || txTypeFilter !== "ALL" || selectedTags.length > 0 || selectedCategoryId)
              ? "No hay resultados para este filtro"
              : "Las transacciones de esta cuenta aparecerán aquí"
          }
        />
      </div>
    );
  }

  const activeFilter = showAllTxns ? txTypeFilter : "ALL";
  const groups = groupByDay(txList);
  let globalIdx = 0;

  return (
    <div className="space-y-4">
      {groups.map(([day, dayTxs]) => {
        const total = dayTotal(dayTxs, activeFilter);
        const isNet = activeFilter === "ALL";
        const isTransferFilter = activeFilter === "TRANSFER";
        const totalColor = isTransferFilter
          ? "text-blue-500 dark:text-blue-400"
          : isNet
            ? total >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400"
            : activeFilter === "INCOME"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400";
        const totalPrefix = isTransferFilter
          ? ""
          : isNet
            ? total >= 0
              ? "+"
              : ""
            : activeFilter === "INCOME"
              ? "+"
              : "-";

        return (
          <div key={day}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {fmtDate(`${day}T12:00:00`)}
              </span>
              {!isTransferFilter && (
                <span className={cn("text-[11px] font-semibold tabular-nums", totalColor)}>
                  {totalPrefix}
                  {fmt(Math.abs(total), currency)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {dayTxs.map((tx) => {
                const idx = globalIdx++;
                const isTransfer = tx.type === "TRANSFER";
                const cat = isTransfer ? undefined : resolveCat(tx, categoryMap);
                const color = isTransfer ? "#3b82f6" : resolveColor(cat?.color);
                const isIncome = tx.type === "INCOME";
                const isOut = isTransfer && tx.toAccountId != null;
                const toAccountName =
                  isTransfer && tx.toAccountId
                    ? (accounts.find((a) => a.id === tx.toAccountId)?.name ?? tx.toAccountId)
                    : null;

                return (
                  <div
                    key={tx.id}
                    onClick={() =>
                      isTransfer ? onSelectTransferTx(tx) : onSelectTx(tx)
                    }
                    className={cn(
                      "fade-up bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 flex items-center gap-3 transition-all duration-200",
                      "hover:-translate-y-px hover:shadow-sm hover:border-gray-200 dark:hover:border-[#3a3a38] cursor-pointer",
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none"
                      style={{ backgroundColor: iconBg(color) }}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight size={16} style={{ color }} />
                      ) : (
                        resolveIcon(cat?.icon)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {isTransfer
                          ? isOut
                            ? `Hacia ${toAccountName}`
                            : "Transferencia recibida"
                          : (cat?.name ?? "—")}
                        {tx.createdBy && (
                          <span className="ml-1 opacity-60">· {tx.createdBy}</span>
                        )}
                      </p>
                      {tx.tags && tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tx.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-px rounded text-[9px] font-medium bg-gray-100 dark:bg-[#252523] text-gray-400 dark:text-gray-500"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold flex-shrink-0 tabular-nums",
                        isTransfer
                          ? "text-blue-500 dark:text-blue-400"
                          : isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500 dark:text-rose-400",
                      )}
                    >
                      {isTransfer ? (isOut ? "→" : "←") : isIncome ? "+" : "-"}
                      {fmt(tx.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
