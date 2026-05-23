import { X } from "lucide-react";
import { type CategoryDto } from "@/api/categories";
import { cn } from "@/lib/utils";
import { resolveColor } from "../utils/colorUtils";

export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryDto[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = categories.find((cat) => cat.id === selectedId);

  if (selected) {
    const col = resolveColor(selected.color);
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSelect("")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 transition-all"
          style={{ borderLeftColor: col, borderLeftWidth: "3px" }}
        >
          {selected.icon && <span>{selected.icon}</span>}
          {selected.name}
          <X size={11} className="text-emerald-500 dark:text-emerald-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
      {categories.map((cat) => {
        const col = resolveColor(cat.color);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48] whitespace-nowrap flex-shrink-0 transition-all"
            style={{ borderLeftColor: col, borderLeftWidth: "3px" }}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
