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
  return categories.map((cat) => {
    const col = resolveColor(cat.color);
    const selected = selectedId === cat.id;
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => onSelect(cat.id)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
          selected
            ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
            : "border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]",
        )}
        style={
          selected
            ? {}
            : { borderLeftColor: col, borderLeftWidth: "3px" }
        }
      >
        {cat.icon && <span>{cat.icon}</span>}
        {cat.name}
      </button>
    );
  });
}
