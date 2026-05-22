import { type CategoryDto } from "@/api/categories";
import { transactionsApi, type TransactionListDto } from "@/api/transactions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import TransactionDetailView from "./TransactionDetailView";
import TransactionEditForm from "./TransactionEditForm";

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
  const [categoryId, setCategoryId] = useState(tx.categoryId ?? "");
  const [date, setDate] = useState(tx.occurredOn.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    } catch (error) {
      setError(getApiErrorMessage(error, "No se pudo eliminar la transaccion"));
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
    } catch (error) {
      setError(getApiErrorMessage(error, "No se pudieron guardar los cambios"));
      setSaving(false);
    }
  }

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
            <TransactionEditForm
              type={type}
              onTypeChange={(t) => {
                setType(t);
                setCategoryId("");
              }}
              amount={amount}
              onAmountChange={setAmount}
              description={description}
              onDescriptionChange={setDescription}
              note={note}
              onNoteChange={setNote}
              tags={tags}
              onTagsChange={setTags}
              categoryId={categoryId}
              onCategoryIdChange={setCategoryId}
              date={date}
              onDateChange={setDate}
              filteredCats={filteredCats}
              currency={currency}
              error={error}
              saving={saving}
              onSave={handleSave}
            />
          ) : (
            <TransactionDetailView
              tx={tx}
              category={category}
              accountName={accountName}
              currency={currency}
              confirmDelete={confirmDelete}
              deleting={deleting}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </>
  );
}
