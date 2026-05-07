import { type CategoryDto } from "@/api/categories";
import { cn } from "@/lib/utils";
import { resolveColor, resolveIcon } from "../../utils/colorUtils";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";

function parseTagsFromInput(input: string): string[] {
  return [...input.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase());
}

export default function TransactionFilters({
  txSearchInput,
  txTypeFilter,
  selectedCategoryId,
  availableTags,
  categoryMap,
  onSetTxSearchInput,
  onSetTxTypeFilter,
  onClearCategory,
}: {
  txSearchInput: string;
  txTypeFilter: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  selectedCategoryId: string | null;
  availableTags: string[];
  categoryMap: Map<string, CategoryDto>;
  onSetTxSearchInput: (v: string) => void;
  onSetTxTypeFilter: (v: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER") => void;
  onClearCategory: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tagPrefix, setTagPrefix] = useState<string | null>(null);

  function detectTagPrefix(value: string, cursor: number) {
    let start = cursor;
    while (start > 0 && value[start - 1] !== " ") start--;
    const word = value.slice(start, cursor);
    setTagPrefix(word.startsWith("#") ? word.slice(1).toLowerCase() : null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSetTxSearchInput(e.target.value);
    detectTagPrefix(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function selectTag(tag: string) {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? txSearchInput.length;
    let start = cursor;
    while (start > 0 && txSearchInput[start - 1] !== " ") start--;
    const newValue = (txSearchInput.slice(0, start) + `#${tag} ` + txSearchInput.slice(cursor)).trim();
    onSetTxSearchInput(newValue);
    setTagPrefix(null);
    setTimeout(() => input?.focus(), 0);
  }

  function removeTag(tag: string) {
    onSetTxSearchInput(
      txSearchInput.replace(new RegExp(`#${tag}\\b\\s?`, "gi"), "").trim(),
    );
  }

  const activeTags = parseTagsFromInput(txSearchInput);
  const dropdownTags =
    tagPrefix !== null
      ? availableTags.filter(
          (t) =>
            t.toLowerCase().startsWith(tagPrefix) &&
            !activeTags.includes(t.toLowerCase()),
        )
      : [];

  return (
    <div className="space-y-2 mb-3">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={txSearchInput}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Escape" && setTagPrefix(null)}
          onBlur={() => setTimeout(() => setTagPrefix(null), 150)}
          placeholder="Buscar... o escribe #tag"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#1a1a18] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
        />
        {dropdownTags.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl shadow-lg overflow-hidden">
            {dropdownTags.map((tag) => (
              <button
                key={tag}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectTag(tag);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
              >
                <span className="text-violet-500 dark:text-violet-400 font-medium">
                  #{tag}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeTags.map((tag) => (
            <button
              key={tag}
              onClick={() => removeTag(tag)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
            >
              #{tag}
              <X size={9} className="ml-0.5" />
            </button>
          ))}
        </div>
      )}

      {selectedCategoryId &&
        (() => {
          const cat = categoryMap.get(selectedCategoryId);
          return (
            <button
              onClick={onClearCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200 w-fit"
              style={{ borderLeft: `3px solid ${resolveColor(cat?.color)}` }}
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
    </div>
  );
}
