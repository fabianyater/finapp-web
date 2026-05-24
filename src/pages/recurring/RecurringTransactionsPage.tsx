import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarClock,
  Loader2,
  Pencil,
  Plus,
  Power,
  RepeatIcon,
  Trash2,
  X,
} from "lucide-react";
import { accountsApi } from "@/api/accounts";
import { categoriesApi, type CategoryDto } from "@/api/categories";
import { recurringTransactionsApi } from "@/api/recurringTransactions";
import { MoneyInput } from "@/components/MoneyInput";
import PageHeader from "@/components/PageHeader";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { RecurringFrequency, RecurringTransaction } from "@/types";
import { resolveColor } from "@/pages/dashboard/utils/colorUtils";

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

const TYPE_LABELS: Record<RecurringTransaction["type"], string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  TRANSFER: "Transferencia",
};

const schema = z.object({
  accountId: z.string().min(1, "Cuenta requerida"),
  categoryId: z.string().optional(),
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "Descripcion requerida").max(200),
  note: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"]),
  nextDueDate: z.string().min(1, "Fecha requerida"),
});

type FormData = z.infer<typeof schema>;

function fmt(amount: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  const today = new Date();
  const due = new Date(`${iso}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function dueLabel(iso: string) {
  const days = daysUntil(iso);
  if (days < 0) return `Vencida hace ${Math.abs(days)} d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence manana";
  return `En ${days} d`;
}

function typeMeta(type: RecurringTransaction["type"]) {
  if (type === "INCOME") {
    return {
      amountPrefix: "+",
      color: "#328758",
      label: TYPE_LABELS.INCOME,
    };
  }
  if (type === "TRANSFER") {
    return {
      amountPrefix: "",
      color: "#36778d",
      label: TYPE_LABELS.TRANSFER,
    };
  }
  return {
    amountPrefix: "-",
    color: "#a94e42",
    label: TYPE_LABELS.EXPENSE,
  };
}

export default function RecurringTransactionsPage() {
  const queryClient = useQueryClient();
  const [sheet, setSheet] = useState<{
    open: boolean;
    item: RecurringTransaction | null;
  }>({ open: false, item: null });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: recurringTransactionsApi.list,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });
  const accounts = accountsData?.data ?? [];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const accountName = (id: string) =>
    accounts.find((account) => account.id === id)?.name ?? "Sin cuenta";
  const categoryFor = (id: string | null) =>
    id ? categories.find((category) => category.id === id) : undefined;

  const toggleMutation = useMutation({
    mutationFn: (id: string) => recurringTransactionsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      toast.success("Estado actualizado");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo cambiar el estado")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringTransactionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      toast.success("Recurrente eliminada");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo eliminar")),
  });

  const active = items.filter((item) => item.active);
  const inactive = items.filter((item) => !item.active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111110]">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader
            title="Recurrentes"
            back={false}
            className="flex items-center gap-2"
          />
          <button
            onClick={() => setSheet({ open: true, item: null })}
            className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(32,28,24,0.14)] transition-colors hover:bg-gray-900 dark:bg-white dark:text-[#1a1a18]"
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(32,28,24,0.08)] dark:bg-[#1e1e1c]">
              <RepeatIcon size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay transacciones recurrentes
            </p>
            <button
              onClick={() => setSheet({ open: true, item: null })}
              className="rounded-full px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
            >
              Crear la primera
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Activas · {active.length}
            </p>
            <div className="flex flex-col gap-3">
              {active.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  accountLabel={accountName(item.accountId)}
                  category={categoryFor(item.categoryId)}
                  onEdit={() => setSheet({ open: true, item })}
                  onToggle={() => toggleMutation.mutate(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {inactive.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Pausadas · {inactive.length}
            </p>
            <div className="flex flex-col gap-3 opacity-70">
              {inactive.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  accountLabel={accountName(item.accountId)}
                  category={categoryFor(item.categoryId)}
                  onEdit={() => setSheet({ open: true, item })}
                  onToggle={() => toggleMutation.mutate(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {sheet.open && (
        <RecurringSheet
          item={sheet.item}
          onClose={() => setSheet({ open: false, item: null })}
        />
      )}
    </div>
  );
}

function RecurringCard({
  item,
  accountLabel,
  category,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: RecurringTransaction;
  accountLabel: string;
  category?: CategoryDto;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = typeMeta(item.type);
  const accent =
    item.type === "TRANSFER" ? meta.color : resolveColor(category?.color, meta.color);
  const isOverdue = daysUntil(item.nextDueDate) < 0;
  const secondaryLabel = [
    FREQUENCY_LABELS[item.frequency],
    accountLabel,
    category?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-3xl border border-white/80 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(32,28,24,0.07),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-[#2a2a28] dark:bg-[#1c1c1a] dark:shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                {item.description}
              </p>
              <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                {meta.label} · {secondaryLabel}
                {!item.active ? " · Pausada" : ""}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-base font-bold leading-none tabular-nums text-gray-700 dark:text-gray-100">
                {meta.amountPrefix}
                {fmt(item.amount, item.currency)}
              </p>
              <p
                className={cn(
                  "mt-1 text-[10px] font-semibold",
                  isOverdue
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-gray-400 dark:text-gray-500",
                )}
              >
                {dueLabel(item.nextDueDate)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <CalendarClock size={12} className="shrink-0" />
              <span className="truncate">{fmtDate(item.nextDueDate)}</span>
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={onToggle}
              title={item.active ? "Pausar" : "Activar"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                item.active
                  ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]",
              )}
            >
              <Power size={14} />
            </button>
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20"
            >
              <Trash2 size={14} />
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecurringSheet({
  item,
  onClose,
}: {
  item: RecurringTransaction | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });
  const accounts = accountsData?.data ?? [];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      accountId: item?.accountId ?? "",
      categoryId: item?.categoryId ?? "",
      type: (item?.type as FormData["type"]) ?? "EXPENSE",
      amount: item?.amount ?? undefined,
      description: item?.description ?? "",
      note: item?.note ?? "",
      frequency: (item?.frequency as FormData["frequency"]) ?? "MONTHLY",
      nextDueDate: item?.nextDueDate ?? new Date().toISOString().slice(0, 10),
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const selectedAccountId = useWatch({ control, name: "accountId" });
  const selectedAccountCurrency =
    accounts.find((account) => account.id === selectedAccountId)?.currency ??
    item?.currency ??
    "COP";

  const filteredCategories = categories.filter((category) =>
    selectedType === "TRANSFER" ? false : category.type === selectedType,
  );

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      recurringTransactionsApi.create({
        accountId: data.accountId,
        categoryId: data.categoryId || undefined,
        type: data.type,
        amount: Math.round(data.amount),
        description: data.description,
        note: data.note || undefined,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      toast.success("Recurrente creada");
      onClose();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo crear")),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      recurringTransactionsApi.update(item!.id, {
        accountId: data.accountId,
        categoryId: data.categoryId || undefined,
        type: data.type,
        amount: Math.round(data.amount),
        description: data.description,
        note: data.note || undefined,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      toast.success("Recurrente actualizada");
      onClose();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo actualizar")),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-[#2a2a28] dark:bg-[#252523] dark:text-gray-200 dark:focus:ring-emerald-950";

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-[0_28px_80px_rgba(32,28,24,0.22)] dark:bg-[#1c1c1a] dark:shadow-2xl sm:m-3 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-[#2a2a28] dark:bg-[#1c1c1a]/95">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {isEdit ? "Editar recurrente" : "Nueva recurrente"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-[#252523]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          <Field label="Tipo">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-1 rounded-full bg-gray-100 p-1 dark:bg-[#252523]">
                  {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((type) => {
                    const selected = field.value === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "rounded-full px-2 py-2 text-xs font-semibold transition-all",
                          selected
                            ? "bg-emerald-700 text-white shadow-sm dark:bg-white dark:text-[#1a1a18]"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400",
                        )}
                      >
                        {TYPE_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Field>

          <Field label="Cuenta" error={errors.accountId?.message}>
            <select {...register("accountId")} className={inputClass}>
              <option value="">Seleccionar cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>

          {selectedType !== "TRANSFER" && (
            <Field label="Categoria">
              <select {...register("categoryId")} className={inputClass}>
                <option value="">Sin categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Monto" error={errors.amount?.message}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  currency={selectedAccountCurrency}
                  placeholder="0"
                  className={inputClass}
                />
              )}
            />
          </Field>

          <Field label="Descripcion" error={errors.description?.message}>
            <input
              {...register("description")}
              placeholder="Arriendo, salario, cuota..."
              className={inputClass}
            />
          </Field>

          <Field label="Nota">
            <input
              {...register("note")}
              placeholder="Opcional"
              className={inputClass}
            />
          </Field>

          <Field label="Frecuencia" error={errors.frequency?.message}>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map(
                    (frequency) => (
                      <button
                        key={frequency}
                        type="button"
                        onClick={() => field.onChange(frequency)}
                        className={cn(
                          "rounded-full border px-2 py-2 text-xs font-semibold transition-all",
                          field.value === frequency
                            ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-[#2a2a28] dark:text-gray-400 dark:hover:bg-[#252523]",
                        )}
                      >
                        {FREQUENCY_LABELS[frequency]}
                      </button>
                    ),
                  )}
                </div>
              )}
            />
          </Field>

          <Field label="Proxima fecha" error={errors.nextDueDate?.message}>
            <input type="date" {...register("nextDueDate")} className={inputClass} />
          </Field>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(29,86,56,0.24)] transition-all hover:bg-emerald-800 disabled:opacity-50 dark:bg-white dark:text-[#1a1a18]"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}
