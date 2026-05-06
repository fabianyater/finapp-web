import { type CategoryDto } from "@/api/categories";
import { transactionsApi, type TransactionListDto } from "@/api/transactions";
import { MoneyInput } from "@/components/MoneyInput";
import TagInput from "@/components/TagInput";
import { cn } from "@/lib/utils";
import { iconBg, resolveColor, resolveIcon } from "../../utils/colorUtils";
import { fmt, fmtDateFull } from "../../utils/formatters";
import { ChevronLeft, X } from "lucide-react";
import { useState } from "react";

export default function TransactionDetailModal({
  tx,
  category,
  accountName,
  currency,
  categories,
  onClose,
  onDeleted,
  onUpdated,
}: {
  tx: TransactionListDto;
  category: { name: string; color: string; icon: string } | undefined;
  accountName: string;
  currency: string;
  categories: CategoryDto[];
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    (tx.type === "TRANSFER" ? "EXPENSE" : tx.type) as "EXPENSE" | "INCOME",
  );
  const [amount, setAmount] = useState<number | "">(tx.amount);
  const [description, setDescription] = useState(tx.description);
  const [note, setNote] = useState(tx.note ?? "");
  const [tags, setTags] = useState<string[]>(tx.tags ?? []);
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [date, setDate] = useState(tx.occurredOn.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isIncome = tx.type === "INCOME";
  const color = resolveColor(category?.color);
  const filteredCats = categories.filter((c) => c.type === type);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await transactionsApi.remove(tx.accountId, tx.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!amount || !description || !categoryId) {
      setError("Completa todos los campos requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await transactionsApi.update(tx.accountId, tx.id, {
        type,
        amount: Math.round(Number(amount)),
        description,
        note: note || undefined,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
        categoryId,
        tags: tags.length > 0 ? tags : undefined,
      });
      onUpdated();
    } catch {
      setError("Error al guardar los cambios");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors";

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#2a2a28] last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        {label}
      </span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-right">
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[90vh]">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
            {isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                }}
                className="flex items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={14} />
                Detalle
              </button>
            ) : (
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Detalle
              </span>
            )}
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Editar
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="px-5 py-4 space-y-4">
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
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Categoría
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filteredCats.map((cat) => {
                      const col = resolveColor(cat.color);
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
                              : { borderLeftColor: col, borderLeftWidth: "3px" }
                          }
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </button>
                      );
                    })}
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
                    <span className="text-gray-300 dark:text-gray-600">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
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
                  <TagInput tags={tags} onChange={setTags} />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 pt-6 pb-4 px-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl leading-none mb-1"
                  style={{ backgroundColor: iconBg(color) }}
                >
                  {resolveIcon(category?.icon)}
                </div>
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500 dark:text-rose-400",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {fmt(tx.amount, currency)}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                  {tx.description}
                </span>
              </div>

              <div className="px-5 pb-2">
                {row(
                  "Tipo",
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-semibold",
                      isIncome
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {isIncome ? "Ingreso" : "Gasto"}
                  </span>,
                )}
                {row(
                  "Categoría",
                  <span className="flex items-center gap-1.5">
                    <span>{resolveIcon(category?.icon)}</span>
                    {category?.name ?? "—"}
                  </span>,
                )}
                {row("Fecha", fmtDateFull(tx.occurredOn))}
                {row("Cuenta", accountName)}
                {tx.note && row("Nota", tx.note)}
                {tx.tags &&
                  tx.tags.length > 0 &&
                  row(
                    "Tags",
                    <div className="flex flex-wrap gap-1 justify-end">
                      {tx.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-[#252523] text-[10px] font-medium text-gray-500 dark:text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>,
                  )}
              </div>

              <div className="px-5 pb-5 pt-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50",
                    confirmDelete
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-gray-100 dark:bg-[#252523] text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30",
                  )}
                >
                  {deleting
                    ? "Eliminando..."
                    : confirmDelete
                      ? "¿Confirmar eliminación?"
                      : "Eliminar transacción"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
