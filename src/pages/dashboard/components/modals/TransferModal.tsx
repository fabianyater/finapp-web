import { type AccountDto } from "@/api/accounts";
import { transactionsApi } from "@/api/transactions";
import { MoneyInput } from "@/components/MoneyInput";
import { cn } from "@/lib/utils";
import { fmt } from "../../utils/formatters";
import { ArrowLeftRight, X } from "lucide-react";
import { useState } from "react";

export default function TransferModal({
  accounts,
  defaultFromAccountId,
  onClose,
  onSuccess,
}: {
  accounts: AccountDto[];
  defaultFromAccountId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fromAccountId, setFromAccountId] = useState(defaultFromAccountId);
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toOptions = accounts.filter((a) => a.id !== fromAccountId);

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !toAccountId) {
      setError("Completa todos los campos requeridos");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("La cuenta origen y destino deben ser diferentes");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await transactionsApi.createTransfer({
        fromAccountId,
        toAccountId,
        amount: Math.round(Number(amount)),
        description: description || undefined,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
      });
      onSuccess();
    } catch {
      setError("Error al crear la transferencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col">
          <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a28]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Transferencia
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Cuenta origen
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => {
                  setFromAccountId(e.target.value);
                  setToAccountId("");
                }}
                className={inputCls}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({fmt(a.currentBalance, a.currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Cuenta destino
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className={cn(inputCls)}
                required
              >
                <option value="">Selecciona una cuenta...</option>
                {toOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({fmt(a.currentBalance, a.currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Monto ({fromAccount?.currency ?? "COP"})
              </label>
              <MoneyInput
                value={amount}
                onChange={setAmount}
                currency={fromAccount?.currency ?? "COP"}
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Descripción{" "}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transferencia entre cuentas"
                className={inputCls}
              />
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

            {error && (
              <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Transfiriendo..." : "Transferir"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
