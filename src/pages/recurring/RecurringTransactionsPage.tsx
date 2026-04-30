import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, X, Power, RepeatIcon, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { recurringTransactionsApi } from '@/api/recurringTransactions'
import { accountsApi } from '@/api/accounts'
import { categoriesApi } from '@/api/categories'
import { toast } from '@/store/toast'
import PageHeader from '@/components/PageHeader'
import { MoneyInput } from '@/components/MoneyInput'
import type { RecurringTransaction, RecurringFrequency } from '@/types'

// ── constants ──────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
}

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Gasto',
  INCOME: 'Ingreso',
  TRANSFER: 'Transferencia',
}

function fmt(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
  accountId: z.string().min(1, 'Cuenta requerida'),
  categoryId: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  description: z.string().min(1, 'Descripción requerida').max(200),
  note: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
  nextDueDate: z.string().min(1, 'Fecha requerida'),
})
type FormData = z.infer<typeof schema>

// ── sheet ──────────────────────────────────────────────────────────────────────

function RecurringSheet({
  item,
  onClose,
}: {
  item: RecurringTransaction | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!item

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  })
  const accounts = accountsData?.data ?? []

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: item?.accountId ?? '',
      categoryId: item?.categoryId ?? '',
      type: (item?.type as FormData['type']) ?? 'EXPENSE',
      amount: item?.amount ?? undefined,
      description: item?.description ?? '',
      note: item?.note ?? '',
      frequency: (item?.frequency as FormData['frequency']) ?? 'MONTHLY',
      nextDueDate: item?.nextDueDate ?? new Date().toISOString().slice(0, 10),
    },
  })

  const selectedType = watch('type')
  const selectedAccountId = watch('accountId')
  const selectedAccountCurrency =
    accounts.find((a: any) => a.id === selectedAccountId)?.currency ?? item?.currency ?? 'COP'

  const filteredCategories = categories.filter((c: any) =>
    selectedType === 'TRANSFER' ? false : c.type === selectedType
  )

  const createMutation = useMutation({
    mutationFn: (d: FormData) =>
      recurringTransactionsApi.create({
        accountId: d.accountId,
        categoryId: d.categoryId || undefined,
        type: d.type,
        amount: Math.round(d.amount),
        description: d.description,
        note: d.note || undefined,
        frequency: d.frequency,
        nextDueDate: d.nextDueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      toast.success('Transacción recurrente creada')
      onClose()
    },
    onError: () => toast.error('No se pudo crear la transacción recurrente'),
  })

  const updateMutation = useMutation({
    mutationFn: (d: FormData) =>
      recurringTransactionsApi.update(item!.id, {
        accountId: d.accountId,
        categoryId: d.categoryId || undefined,
        type: d.type,
        amount: Math.round(d.amount),
        description: d.description,
        note: d.note || undefined,
        frequency: d.frequency,
        nextDueDate: d.nextDueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      toast.success('Transacción recurrente actualizada')
      onClose()
    },
    onError: () => toast.error('No se pudo actualizar la transacción recurrente'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (d: FormData) => {
    if (isEdit) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1c1a] shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Editar' : 'Nueva'} transacción recurrente
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Tipo</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => field.onChange(t)}
                      className={cn(
                        'py-2 rounded-xl text-sm font-medium border transition-colors',
                        field.value === t
                          ? t === 'EXPENSE'
                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                            : t === 'INCOME'
                              ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                              : 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                          : 'border-gray-200 dark:border-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523]'
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Cuenta</label>
            <select
              {...register('accountId')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId.message}</p>}
          </div>

          {/* Category (hidden for transfers) */}
          {selectedType !== 'TRANSFER' && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Categoría</label>
              <select
                {...register('categoryId')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Sin categoría</option>
                {filteredCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Monto</label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  currency={selectedAccountCurrency}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              )}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Descripción</label>
            <input
              {...register('description')}
              placeholder="Ej: Arriendo, Netflix, etc."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nota (opcional)</label>
            <input
              {...register('note')}
              placeholder="Nota adicional"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Frecuencia</label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => field.onChange(f)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-medium border transition-colors',
                        field.value === f
                          ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                          : 'border-gray-200 dark:border-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523]'
                      )}
                    >
                      {FREQUENCY_LABELS[f]}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.frequency && <p className="text-xs text-red-500 mt-1">{errors.frequency.message}</p>}
          </div>

          {/* Next due date */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Próxima fecha</label>
            <input
              type="date"
              {...register('nextDueDate')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {errors.nextDueDate && <p className="text-xs text-red-500 mt-1">{errors.nextDueDate.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#1a1a18] dark:bg-white text-white dark:text-[#1a1a18] text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function RecurringTransactionsPage() {
  const queryClient = useQueryClient()
  const [sheet, setSheet] = useState<{ open: boolean; item: RecurringTransaction | null }>({
    open: false,
    item: null,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: recurringTransactionsApi.list,
  })

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  })
  const accounts = accountsData?.data ?? []

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? '–'

  const categoryName = (id: string | null) =>
    id ? ((categories as any[]).find((c) => c.id === id)?.name ?? '–') : '–'

  const toggleMutation = useMutation({
    mutationFn: (id: string) => recurringTransactionsApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] }),
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringTransactionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      toast.success('Transacción recurrente eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la transacción recurrente'),
  })

  const active = items.filter((i) => i.active)
  const inactive = items.filter((i) => !i.active)

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#111110]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="Recurrentes" className="flex items-center gap-2" />
          <button
            onClick={() => setSheet({ open: true, item: null })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1a18] dark:bg-white text-white dark:text-[#1a1a18] text-sm font-medium hover:opacity-90 transition-opacity"
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
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1e1e1c] flex items-center justify-center">
              <RepeatIcon size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay transacciones recurrentes
            </p>
            <button
              onClick={() => setSheet({ open: true, item: null })}
              className="text-sm text-blue-500 hover:underline"
            >
              Crear la primera
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Activas · {active.length}
            </p>
            <div className="flex flex-col gap-2">
              {active.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  accountLabel={accountName(item.accountId)}
                  categoryLabel={categoryName(item.categoryId)}
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
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Pausadas · {inactive.length}
            </p>
            <div className="flex flex-col gap-2 opacity-60">
              {inactive.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  accountLabel={accountName(item.accountId)}
                  categoryLabel={categoryName(item.categoryId)}
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
  )
}

// ── card ───────────────────────────────────────────────────────────────────────

function RecurringCard({
  item,
  accountLabel,
  categoryLabel,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: RecurringTransaction
  accountLabel: string
  categoryLabel: string
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const typeColor =
    item.type === 'EXPENSE'
      ? 'text-red-500'
      : item.type === 'INCOME'
        ? 'text-green-500'
        : 'text-blue-500'

  return (
    <div className="bg-white dark:bg-[#1c1c1a] rounded-2xl border border-gray-100 dark:border-[#2a2a28] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('text-xs font-semibold', typeColor)}>
              {TYPE_LABELS[item.type]}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              · {FREQUENCY_LABELS[item.frequency]}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {item.description}
          </p>
          <p className={cn('text-base font-bold mt-0.5', typeColor)}>
            {item.type === 'EXPENSE' ? '−' : '+'}{fmt(item.amount, item.currency)}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">{accountLabel}</span>
            {categoryLabel !== '–' && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{categoryLabel}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CalendarClock size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Próxima: {fmtDate(item.nextDueDate)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            title={item.active ? 'Pausar' : 'Activar'}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-xl transition-colors',
              item.active
                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]'
            )}
          >
            <Power size={14} />
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
