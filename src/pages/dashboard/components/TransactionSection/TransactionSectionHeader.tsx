import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function TransactionSectionHeader({
  showDeleted,
  hasRecentTxs,
  onToggleDeleted,
  onOpenFullModal,
}: {
  showDeleted: boolean;
  hasRecentTxs: boolean;
  onToggleDeleted: () => void;
  onOpenFullModal: (categoryId?: string | null) => void;
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
          {showDeleted ? "Eliminadas" : "Recientes"}
        </p>
      </div>

      {!showDeleted && (
        hasRecentTxs && (
          <button
            onClick={() => onOpenFullModal()}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            Ver todas
          </button>
        )
      )}
    </div>
  );
}
