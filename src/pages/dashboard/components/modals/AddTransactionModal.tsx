import {
  categoriesApi,
  type CategoryDto,
} from "@/api/categories";
import {
  transactionsApi,
  type ParseTransactionResponse,
} from "@/api/transactions";
import { MoneyInput } from "@/components/MoneyInput";
import TagInput from "@/components/TagInput";
import { cn } from "@/lib/utils";
import { resolveColor } from "../../utils/colorUtils";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const AI_NEW_CATEGORY = "__ai_new__";

export default function AddTransactionModal({
  accountId,
  categories,
  initialDescription,
  currency,
  onClose,
  onSuccess,
  aiParsed,
}: {
  accountId: string;
  categories: CategoryDto[];
  initialDescription: string;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
  aiParsed?: ParseTransactionResponse | null;
}) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    aiParsed?.type ?? "EXPENSE",
  );
  const [amount, setAmount] = useState<number | "">(aiParsed?.amount ?? "");
  const [description, setDescription] = useState(
    aiParsed?.description ?? initialDescription,
  );
  const [note, setNote] = useState(aiParsed?.note ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState(() => {
    if (aiParsed?.categoryId) return aiParsed.categoryId;
    if (aiParsed?.newCategory) return AI_NEW_CATEGORY;
    return "";
  });
  const [date, setDate] = useState(
    aiParsed?.occurredOn ?? new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) {
      setError("Completa todos los campos requeridos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let resolvedCategoryId = categoryId;

      if (categoryId === AI_NEW_CATEGORY && aiParsed?.newCategory) {
        const nc = aiParsed.newCategory;
        const newId = await categoriesApi.create({
          name: nc.name,
          icon: nc.icon,
          color: nc.color,
          type,
        });
        resolvedCategoryId = newId;
      }

      await transactionsApi.create(accountId, {
        type,
        amount: Math.round(Number(amount)),
        description,
        note: note || undefined,
        categoryId: resolvedCategoryId,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
        tags: tags.length > 0 ? tags : undefined,
      });
      onSuccess();
    } catch {
      setError("Error al crear la transacción");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col h-[500px]">
          <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a28]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Nueva transacción
              </h2>
              {aiParsed && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <Sparkles size={10} />
                  IA
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-[#252523] rounded-xl">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setCategoryId("");
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
                  onChange={setAmount}
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
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿En qué?"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Categoría
                </label>
                <div className="flex flex-wrap gap-2">
                  {aiParsed?.newCategory && (
                    <button
                      type="button"
                      onClick={() => setCategoryId(AI_NEW_CATEGORY)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        categoryId === AI_NEW_CATEGORY
                          ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : "border-dashed border-gray-300 dark:border-[#4a4a48] text-gray-500 dark:text-gray-400",
                      )}
                    >
                      <Sparkles size={10} />
                      {aiParsed.newCategory.icon} {aiParsed.newCategory.name}
                    </button>
                  )}
                  {filtered.length === 0 && !aiParsed?.newCategory ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Sin categorías de tipo{" "}
                      {type === "EXPENSE" ? "gasto" : "ingreso"}.{" "}
                      <Link
                        to="/categories"
                        className="text-emerald-600 dark:text-emerald-400 underline"
                      >
                        Crea una
                      </Link>
                    </p>
                  ) : (
                    filtered.map((cat) => {
                      const color = resolveColor(cat.color);
                      const selected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            selected
                              ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                              : "border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]",
                          )}
                          style={
                            selected
                              ? {}
                              : {
                                  borderLeftColor: color,
                                  borderLeftWidth: "3px",
                                }
                          }
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Nota{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agrega un detalle..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Tags{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Guardar transacción"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
