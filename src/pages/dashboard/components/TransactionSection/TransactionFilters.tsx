import { type CategoryDto } from "@/api/categories";
import { cn } from "@/lib/utils";
import { resolveColor, resolveIcon } from "../../utils/colorUtils";
import { Search, X } from "lucide-react";

export default function TransactionFilters({
  txSearchInput,
  txTypeFilter,
  selectedCategoryId,
  selectedTags,
  availableTags,
  categoryMap,
  onSetTxSearchInput,
  onSetTxTypeFilter,
  onClearCategory,
  onSetSelectedTags,
}: {
  txSearchInput: string;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  selectedCategoryId: string | null;
  selectedTags: string[];
  availableTags: string[];
  categoryMap: Map<string, CategoryDto>;
  onSetTxSearchInput: (v: string) => void;
  onSetTxTypeFilter: (v: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER") => void;
  onClearCategory: () => void;
  onSetSelectedTags: (tags: string[]) => void;
}) {
  return (
    <div className="space-y-2 mb-3">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={txSearchInput}
          onChange={(e) => onSetTxSearchInput(e.target.value)}
          placeholder="Buscar transacciones..."
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#1a1a18] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
        />
      </div>

      {selectedCategoryId && (() => {
        const cat = categoryMap.get(selectedCategoryId);
        return (
          <button
            onClick={onClearCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200 w-fit"
            style={{
              borderLeft: `3px solid ${resolveColor(cat?.color)}`,
            }}
          >
            <span>{resolveIcon(cat?.icon)}</span>
            {cat?.name ?? "Categoría"}
            <X size={11} className="text-gray-400 dark:text-gray-500 ml-0.5" />
          </button>
        );
      })()}

      <div className="flex gap-1.5 flex-wrap">
        {(["ALL", "EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onSetTxTypeFilter(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              txTypeFilter === t
                ? t === "EXPENSE"
                  ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : t === "INCOME"
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    : t === "TRANSFER"
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]",
            )}
          >
            {t === "ALL"
              ? "Todos"
              : t === "EXPENSE"
                ? "Gastos"
                : t === "INCOME"
                  ? "Ingresos"
                  : "Transferencias"}
          </button>
        ))}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  onSetSelectedTags(
                    isActive
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag],
                  )
                }
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
                    : "bg-gray-100 dark:bg-[#252523] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2f2f2d]",
                )}
              >
                #{tag}
                {isActive && <X size={9} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
