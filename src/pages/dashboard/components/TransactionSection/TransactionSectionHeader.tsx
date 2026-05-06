import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Download, Loader2, Trash2 } from "lucide-react";

export default function TransactionSectionHeader({
  showDeleted,
  showAllTxns,
  hasRecentTxs,
  isExporting,
  onToggleDeleted,
  onToggleAllTxns,
  onExportCsv,
  onResetFilters,
}: {
  showDeleted: boolean;
  showAllTxns: boolean;
  hasRecentTxs: boolean;
  isExporting: boolean;
  onToggleDeleted: () => void;
  onToggleAllTxns: () => void;
  onExportCsv: () => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDeleted}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
            showDeleted
              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
              : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300",
          )}
          title="Ver eliminadas"
        >
          <Trash2 size={13} />
        </button>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {showDeleted
            ? "Eliminadas"
            : showAllTxns
              ? "Transacciones"
              : "Recientes"}
        </p>
      </div>

      {!showDeleted &&
        (showAllTxns ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              disabled={isExporting}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              title="Exportar CSV"
            >
              {isExporting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
            </button>
            <button
              onClick={onResetFilters}
              className="flex items-center gap-0.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft size={12} />
              Recientes
            </button>
          </div>
        ) : (
          hasRecentTxs && (
            <button
              onClick={onToggleAllTxns}
              className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Ver todas
              <ChevronRight size={12} />
            </button>
          )
        ))}
    </div>
  );
}
