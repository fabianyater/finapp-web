import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Controller, type Resolver, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  Ban,
  BellRing,
  CheckCircle2,
  CreditCard,
  Loader2,
  Pencil,
  Play,
  Plus,
  Power,
  ReceiptText,
  Trash2,
  X,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { MoneyInput } from '@/components/MoneyInput'
import { accountsApi } from '@/api/accounts'
import { categoriesApi, type CategoryDto } from '@/api/categories'
import { subscriptionsApi } from '@/api/subscriptions'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'
import { SubscriptionBrandMark } from './SubscriptionBrandMark'
import type {
  RecurringFrequency,
  Subscription,
  SubscriptionPayment,
  SubscriptionStatus,
} from '@/types'

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  CANCELED: 'Cancelada',
}

const subscriptionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  accountId: z.string().min(1, 'Cuenta requerida'),
  categoryId: z.string().min(1, 'Categoria requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
  nextDueDate: z.string().min(1, 'Fecha requerida'),
  reminderDaysBefore: z.coerce.number().int().min(0, 'Usa 0 o mas dias'),
  autoRenew: z.boolean(),
})

const paymentSchema = z.object({
  paidDate: z.string().min(1, 'Fecha requerida'),
  note: z.string().max(300).optional(),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>
type PaymentFormData = z.infer<typeof paymentSchema>

function formatMoney(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function dueLabel(value: string) {
  const due = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (days < 0) return `Vencida hace ${Math.abs(days)} d`
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence manana'
  return `Vence en ${days} d`
}

function monthlyAmount(item: Subscription) {
  switch (item.frequency) {
    case 'DAILY':
      return item.amount * 30
    case 'WEEKLY':
      return item.amount * 52 / 12
    case 'BIWEEKLY':
      return item.amount * 26 / 12
    case 'YEARLY':
      return item.amount / 12
    default:
      return item.amount
  }
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const [editor, setEditor] = useState<Subscription | null | undefined>()
  const [paymentTarget, setPaymentTarget] = useState<Subscription | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionsApi.list,
  })
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const accounts = accountsData?.data ?? []
  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE')
  const accountName = (id: string) => accounts.find((account) => account.id === id)?.name ?? 'Cuenta'
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? 'Categoria'

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubscriptionStatus }) =>
      subscriptionsApi.changeStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const deleteMutation = useMutation({
    mutationFn: subscriptionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Suscripcion eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la suscripcion'),
  })

  const active = items.filter((item) => item.status === 'ACTIVE')
  const paused = items.filter((item) => item.status === 'PAUSED')
  const canceled = items.filter((item) => item.status === 'CANCELED')
  const activeMonthly = active.reduce((total, item) => total + monthlyAmount(item), 0)
  const summaryCurrency = active[0]?.currency ?? items[0]?.currency ?? 'COP'
  const nextSubscription = [...active].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0]

  return (
    <div className="min-h-screen bg-[#f3f6f1] dark:bg-[#111110]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-5">
          <PageHeader title="Suscripciones" back={false} className="flex items-center gap-2" />
          <button
            onClick={() => setEditor(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1a18] dark:bg-white text-white dark:text-[#1a1a18] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        {items.length > 0 && (
          <SubscriptionSummary
            activeCount={active.length}
            monthlyTotal={formatMoney(Math.round(activeMonthly), summaryCurrency)}
            nextSubscription={nextSubscription}
          />
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1e1e1c] flex items-center justify-center">
              <CreditCard size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay suscripciones</p>
            <button onClick={() => setEditor(null)} className="text-sm text-blue-500 hover:underline">
              Crear la primera
            </button>
          </div>
        )}

        <SubscriptionSection
          title="Activas"
          items={active}
          accountName={accountName}
          categoryName={categoryName}
          onEdit={setEditor}
          onPay={setPaymentTarget}
          onStatus={(item, status) => statusMutation.mutate({ id: item.id, status })}
          onDelete={(item) => deleteMutation.mutate(item.id)}
        />
        <SubscriptionSection
          title="Pausadas"
          items={paused}
          dimmed
          accountName={accountName}
          categoryName={categoryName}
          onEdit={setEditor}
          onPay={setPaymentTarget}
          onStatus={(item, status) => statusMutation.mutate({ id: item.id, status })}
          onDelete={(item) => deleteMutation.mutate(item.id)}
        />
        <SubscriptionSection
          title="Canceladas"
          items={canceled}
          dimmed
          accountName={accountName}
          categoryName={categoryName}
          onEdit={setEditor}
          onPay={setPaymentTarget}
          onStatus={(item, status) => statusMutation.mutate({ id: item.id, status })}
          onDelete={(item) => deleteMutation.mutate(item.id)}
        />
      </div>

      {editor !== undefined && (
        <SubscriptionSheet
          item={editor}
          accounts={accounts}
          expenseCategories={expenseCategories}
          onClose={() => setEditor(undefined)}
        />
      )}
      {paymentTarget && (
        <PaymentSheet item={paymentTarget} onClose={() => setPaymentTarget(null)} />
      )}
    </div>
  )
}

function SubscriptionSummary({
  activeCount,
  monthlyTotal,
  nextSubscription,
}: {
  activeCount: number
  monthlyTotal: string
  nextSubscription?: Subscription
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1c1c1a]">
      <div className="grid grid-cols-[0.8fr_1.2fr] divide-x divide-gray-100 dark:divide-[#2a2a28]">
        <SummaryCell label="Activas" value={`${activeCount}`} />
        <SummaryCell label="Proyeccion mensual" value={monthlyTotal} />
      </div>
      {nextSubscription && (
        <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-[#2a2a28]">
          <SubscriptionBrandMark name={nextSubscription.name} className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Proximo cobro
            </p>
            <div className="flex min-w-0 items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {nextSubscription.name}
              </p>
              <p className="shrink-0 text-xs font-medium tabular-nums text-gray-500 dark:text-gray-300">
                {formatDate(nextSubscription.nextDueDate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  )
}

function SubscriptionSection({
  title,
  items,
  dimmed,
  accountName,
  categoryName,
  onEdit,
  onPay,
  onStatus,
  onDelete,
}: {
  title: string
  items: Subscription[]
  dimmed?: boolean
  accountName: (id: string) => string
  categoryName: (id: string) => string
  onEdit: (item: Subscription) => void
  onPay: (item: Subscription) => void
  onStatus: (item: Subscription, status: SubscriptionStatus) => void
  onDelete: (item: Subscription) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="mb-6">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
        {title} · {items.length}
      </p>
      <div className={cn('flex flex-col gap-2', dimmed && 'opacity-75')}>
        {items.map((item) => (
          <SubscriptionCard
            key={item.id}
            item={item}
            accountLabel={accountName(item.accountId)}
            categoryLabel={categoryName(item.categoryId)}
            onEdit={() => onEdit(item)}
            onPay={() => onPay(item)}
            onStatus={(status) => onStatus(item, status)}
            onDelete={() => onDelete(item)}
          />
        ))}
      </div>
    </section>
  )
}

function SubscriptionCard({
  item,
  accountLabel,
  categoryLabel,
  onEdit,
  onPay,
  onStatus,
  onDelete,
}: {
  item: Subscription
  accountLabel: string
  categoryLabel: string
  onEdit: () => void
  onPay: () => void
  onStatus: (status: SubscriptionStatus) => void
  onDelete: () => void
}) {
  const dueCopy = item.status === 'CANCELED' ? 'Ultimo vencimiento' : dueLabel(item.nextDueDate)

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1c1c1a]">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <SubscriptionBrandMark name={item.name} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2">
              <StatusBadge status={item.status} />
              <span className="truncate text-xs text-gray-400 dark:text-gray-500">
                {FREQUENCY_LABELS[item.frequency]}{item.autoRenew ? ' · Auto' : ''}
              </span>
            </div>
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatMoney(item.amount, item.currency)}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {item.frequency === 'MONTHLY' ? 'por mes' : FREQUENCY_LABELS[item.frequency].toLowerCase()}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-[#252523]">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {dueCopy}
            </p>
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              {formatDate(item.nextDueDate)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 dark:bg-[#1c1c1a]">
              <BellRing size={11} />
              {item.reminderDaysBefore} d
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
          <span className="truncate">{accountLabel}</span>
          <span>·</span>
          <span className="truncate">{categoryLabel}</span>
          {item.lastPaidDate && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} />
                {formatDate(item.lastPaidDate)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/70 px-3 py-2 dark:border-[#2a2a28] dark:bg-[#171715]">
        {item.status !== 'CANCELED' ? (
          <button
            title="Registrar pago"
            onClick={onPay}
            className="flex h-8 min-w-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
          >
            <ReceiptText size={13} />
            Pago
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-0.5">
          <IconButton title="Editar" onClick={onEdit}>
            <Pencil size={14} />
          </IconButton>
          {item.status === 'ACTIVE' ? (
            <IconButton title="Pausar" onClick={() => onStatus('PAUSED')} className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Power size={14} />
            </IconButton>
          ) : (
            <IconButton title="Activar" onClick={() => onStatus('ACTIVE')} className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <Play size={14} />
            </IconButton>
          )}
          {item.status !== 'CANCELED' && (
            <IconButton title="Cancelar" onClick={() => onStatus('CANCELED')}>
              <Ban size={14} />
            </IconButton>
          )}
          <IconButton title="Eliminar" onClick={onDelete} className="text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={cn(
      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300',
      status === 'PAUSED' && 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300',
      status === 'CANCELED' && 'bg-gray-100 text-gray-500 dark:bg-[#252523] dark:text-gray-400',
    )}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors',
        className,
      )}
    >
      {children}
    </button>
  )
}

function SubscriptionSheet({
  item,
  accounts,
  expenseCategories,
  onClose,
}: {
  item: Subscription | null
  accounts: Array<{ id: string; name: string; currency: string }>
  expenseCategories: CategoryDto[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!item
  const { register, control, handleSubmit, formState: { errors } } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionFormData>,
    defaultValues: {
      name: item?.name ?? '',
      accountId: item?.accountId ?? '',
      categoryId: item?.categoryId ?? '',
      amount: item?.amount ?? undefined,
      frequency: item?.frequency ?? 'MONTHLY',
      nextDueDate: item?.nextDueDate ?? new Date().toISOString().slice(0, 10),
      reminderDaysBefore: item?.reminderDaysBefore ?? 3,
      autoRenew: item?.autoRenew ?? true,
    },
  })

  const accountId = useWatch({ control, name: 'accountId' })
  const name = useWatch({ control, name: 'name' })
  const currency = accounts.find((account) => account.id === accountId)?.currency ?? item?.currency ?? 'COP'
  const payload = (data: SubscriptionFormData) => ({
    ...data,
    amount: Math.round(data.amount),
    reminderDaysBefore: Math.round(data.reminderDaysBefore),
  })

  const createMutation = useMutation({
    mutationFn: (data: SubscriptionFormData) => subscriptionsApi.create(payload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Suscripcion creada')
      onClose()
    },
    onError: () => toast.error('No se pudo crear la suscripcion'),
  })
  const updateMutation = useMutation({
    mutationFn: (data: SubscriptionFormData) => subscriptionsApi.update(item!.id, payload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Suscripcion actualizada')
      onClose()
    },
    onError: () => toast.error('No se pudo actualizar la suscripcion'),
  })

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <SheetFrame title={isEdit ? 'Editar suscripcion' : 'Nueva suscripcion'} onClose={onClose}>
      <form
        onSubmit={handleSubmit((data) => isEdit ? updateMutation.mutate(data) : createMutation.mutate(data))}
        className="flex flex-col gap-4 p-5"
      >
        <Field label="Nombre" error={errors.name?.message}>
          <div className="flex items-center gap-2">
            <SubscriptionBrandMark name={name ?? ''} className="h-10 w-10 rounded-lg" />
            <input {...register('name')} placeholder="Netflix" className={inputClass} />
          </div>
        </Field>
        <Field label="Cuenta" error={errors.accountId?.message}>
          <select {...register('accountId')} className={inputClass}>
            <option value="">Seleccionar cuenta</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
        <Field label="Categoria" error={errors.categoryId?.message}>
          <select {...register('categoryId')} className={inputClass}>
            <option value="">Seleccionar categoria de gasto</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Monto" error={errors.amount?.message}>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                value={field.value ?? ''}
                onChange={field.onChange}
                currency={currency}
                placeholder="0"
                className={inputClass}
              />
            )}
          />
        </Field>
        <Field label="Frecuencia" error={errors.frequency?.message}>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((frequency) => (
                  <button
                    key={frequency}
                    type="button"
                    onClick={() => field.onChange(frequency)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-medium border transition-colors',
                      field.value === frequency
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                        : 'border-gray-200 dark:border-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523]',
                    )}
                  >
                    {FREQUENCY_LABELS[frequency]}
                  </button>
                ))}
              </div>
            )}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Proximo cobro" error={errors.nextDueDate?.message}>
            <input type="date" {...register('nextDueDate')} className={inputClass} />
          </Field>
          <Field label="Avisar antes" error={errors.reminderDaysBefore?.message}>
            <input type="number" min={0} {...register('reminderDaysBefore')} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-[#2a2a28] px-3 py-2.5">
          <span className="text-sm text-gray-700 dark:text-gray-200">Renovacion automatica</span>
          <input type="checkbox" {...register('autoRenew')} className="h-4 w-4 accent-emerald-500" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full py-2.5 rounded-xl bg-[#1a1a18] dark:bg-white text-white dark:text-[#1a1a18] text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear'}
        </button>
      </form>
    </SheetFrame>
  )
}

function PaymentSheet({ item, onClose }: { item: Subscription; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['subscriptions', item.id, 'payments'],
    queryFn: () => subscriptionsApi.listPayments(item.id),
  })
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentFormData>,
    defaultValues: {
      paidDate: new Date().toISOString().slice(0, 10),
      note: '',
    },
  })
  const mutation = useMutation({
    mutationFn: subscriptionsApi.recordPayment.bind(null, item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions', item.id, 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Pago registrado')
      onClose()
    },
    onError: () => toast.error('No se pudo registrar el pago'),
  })

  return (
    <SheetFrame title="Registrar pago" onClose={onClose}>
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-[#2a2a28]">
        <SubscriptionBrandMark name={item.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Vence {formatDate(item.nextDueDate)} · {formatMoney(item.amount, item.currency)}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4 p-5 border-b border-gray-100 dark:border-[#2a2a28]">
        <Field label="Fecha de pago" error={errors.paidDate?.message}>
          <input type="date" {...register('paidDate')} className={inputClass} />
        </Field>
        <Field label="Nota">
          <input {...register('note')} placeholder="Opcional" className={inputClass} />
        </Field>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          Crear gasto
        </button>
      </form>
      <PaymentHistory payments={payments} isLoading={isLoading} />
    </SheetFrame>
  )
}

function PaymentHistory({ payments, isLoading }: { payments: SubscriptionPayment[]; isLoading: boolean }) {
  return (
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
        Pagos previos
      </p>
      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-gray-400" />
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Sin pagos registrados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-xl bg-gray-50 dark:bg-[#252523] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {formatMoney(payment.amount, payment.currency)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(payment.paidDate)}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Cobro de {formatDate(payment.dueDate)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SheetFrame({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1c1c1a] shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <IconButton title="Cerrar" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#252523] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
