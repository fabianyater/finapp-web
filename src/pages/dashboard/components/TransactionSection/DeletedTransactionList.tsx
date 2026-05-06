import { type CategoryDto } from "@/api/categories";
import { type DeletedTransactionDto } from "@/api/transactions";
import EmptyState from "@/components/EmptyState";
import SkeletonRow from "@/components/SkeletonRow";
import { cn } from "@/lib/utils";
import { iconBg, resolveColor, resolveIcon } from "../../utils/colorUtils";
import { fmt, fmtDate } from "../../utils/formatters";
import { Trash2 } from "lucide-react";

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

export default function DeletedTransactionList({
  deletedLoading,
  deletedTxs,
  currency,
  categoryMap,
  onRestore,
}: {
  deletedLoading: boolean;
  deletedTxs: DeletedTransactionDto[];
  currency: string;
  categoryMap: Map<string, CategoryDto>;
  onRestore: (tx: DeletedTransactionDto) => void;
}) {
  if (deletedLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (deletedTxs.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
        <EmptyState
          icon={Trash2}
          title="Sin transacciones eliminadas"
          sub="Las transacciones eliminadas de esta cuenta aparecerán aquí"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deletedTxs.map((tx) => {
        const cat = resolveCat(tx, categoryMap);
        const color = resolveColor(cat?.color);
        const isIncome = tx.type === "INCOME";
        const deletedLabel = fmtDate(tx.deletedAt);

        return (
          <div
            key={tx.id}
            className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 flex items-center gap-3 opacity-70"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none"
              style={{ backgroundColor: iconBg(color) }}
            >
              {resolveIcon(cat?.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {tx.description}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                Eliminada {deletedLabel}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400",
                )}
              >
                {isIncome ? "+" : "-"}
                {fmt(tx.amount, currency)}
              </span>
              <button
                onClick={() => onRestore(tx)}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Restaurar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
