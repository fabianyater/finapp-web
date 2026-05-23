import { type CategoryDto } from "@/api/categories";
import { MoneyInput } from "@/components/MoneyInput";
import TagInput from "@/components/TagInput";
import CategoryPicker from "../CategoryPicker";
import { cn } from "@/lib/utils";

export default function TransactionEditForm({
  type,
  onTypeChange,
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  note,
  onNoteChange,
  tags,
  onTagsChange,
  categoryId,
  onCategoryIdChange,
  date,
  onDateChange,
  filteredCats,
  currency,
  error,
  saving,
  onSave,
}: {
  type: "EXPENSE" | "INCOME";
  onTypeChange: (t: "EXPENSE" | "INCOME") => void;
  amount: number | "";
  onAmountChange: (v: number | "") => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
  tags: string[];
  onTagsChange: (v: string[]) => void;
  categoryId: string;
  onCategoryIdChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
  filteredCats: CategoryDto[];
  currency: string;
  error: string;
  saving: boolean;
  onSave: () => void;
}) {
  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-[#252523] rounded-xl">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onTypeChange(t);
                onCategoryIdChange("");
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all",
                type === t
                  ? t === "EXPENSE"
                    ? "bg-white dark:bg-[#1a1a18] text-rose-600 dark:text-rose-400 shadow-sm"
                    : "bg-white dark:bg-[#1a1a18] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              {t === "EXPENSE" ? "Gasto" : "Ingreso"}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Monto ({currency})
          </label>
          <MoneyInput
            value={amount}
            onChange={onAmountChange}
            currency={currency}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="¿En qué?"
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Categoría
          </label>
          <CategoryPicker
            categories={filteredCats}
            selectedId={categoryId}
            onSelect={onCategoryIdChange}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Nota{" "}
            <span className="text-gray-300 dark:text-gray-600">
              (opcional)
            </span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Agrega una nota..."
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            Tags{" "}
            <span className="text-gray-300 dark:text-gray-600">
              (opcional)
            </span>
          </label>
          <TagInput tags={tags} onChange={onTagsChange} />
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400">
            {error}
          </p>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
