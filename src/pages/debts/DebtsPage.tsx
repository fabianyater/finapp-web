import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, Ban, HandCoins, Loader2, Plus, ReceiptText, Trash2, X } from 'lucide-react'
import { accountsApi } from '@/api/accounts'
import { debtsApi } from '@/api/debts'
import PageHeader from '@/components/PageHeader'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'
import type { Debt, DebtDirection } from '@/types'

type DebtForm = {
  direction: DebtDirection
  counterparty: string
  description: string
  amount: string
  currency: string
  accountId: string
  dueDate: string
  note: string
}

type PaymentForm = {
  amount: string
  accountId: string
  paidOn: string
  note: string
}

const defaultDebtForm: DebtForm = {
  direction: 'I_OWE',
  counterparty: '',
  description: '',
  amount: '',
  currency: 'COP',
  accountId: '',
  dueDate: '',
  note: '',
}

function formatMoney(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function dueCopy(value: string | null) {
  if (!value) return 'Sin vencimiento'
  const due = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (days < 0) return `Vencida hace ${Math.abs(days)} d`
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence manana'
  return `Vence en ${days} d`
}

export default function DebtsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<Debt | null>(null)
  const { data: debts = [], isLoading } = useQuery({ queryKey: ['debts'], queryFn: debtsApi.list })
  const { data: accountsData } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const accounts = (accountsData?.data ?? []).filter((account) => !account.isArchived)

  const openDebts = debts.filter((debt) => debt.status === 'OPEN')
  const closedDebts = debts.filter((debt) => debt.status !== 'OPEN')
  const summary = useMemo(() => {
    return openDebts.reduce(
      (total, debt) => {
        if (debt.direction === 'I_OWE') total.iOwe += debt.outstandingAmount
        else total.owedToMe += debt.outstandingAmount
        total.currency = debt.currency
        return total
      },
      { iOwe: 0, owedToMe: 0, currency: openDebts[0]?.currency ?? 'COP' },
    )
  }, [openDebts])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['debts'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
  }

  const cancelMutation = useMutation({
    mutationFn: debtsApi.cancel,
    onSuccess: invalidate,
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo cancelar la deuda')),
  })
  const deleteMutation = useMutation({
    mutationFn: debtsApi.remove,
    onSuccess: invalidate,
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo eliminar la deuda')),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111110]">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <PageHeader title="Deudas" back={false} className="flex items-center gap-2" />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(32,28,24,0.14)] transition-colors hover:bg-gray-900 dark:bg-white dark:text-[#1a1a18]"
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        <section className="mb-6 rounded-3xl border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(32,28,24,0.075),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-[#292927] dark:bg-[#1c1c1a] dark:shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-[#2a2a28]">
            <SummaryMetric label="Debo" value={formatMoney(summary.iOwe, summary.currency)} tone="text-rose-500" />
            <SummaryMetric label="Me deben" value={formatMoney(summary.owedToMe, summary.currency)} tone="text-emerald-600" />
          </div>
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-[#2a2a28] dark:text-gray-500">
            Puedes registrar prestamos que entran a una cuenta o dejarlos solo como compromiso.
          </p>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-gray-400" />
          </div>
        ) : debts.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            <DebtSection
              title="Abiertas"
              items={openDebts}
              onPay={setPaymentTarget}
              onCancel={(debt) => cancelMutation.mutate(debt.id)}
              onDelete={(debt) => deleteMutation.mutate(debt.id)}
            />
            <DebtSection
              title="Cerradas"
              items={closedDebts}
              dimmed
              onPay={setPaymentTarget}
              onCancel={(debt) => cancelMutation.mutate(debt.id)}
              onDelete={(debt) => deleteMutation.mutate(debt.id)}
            />
          </>
        )}
      </div>

      {showCreate && (
        <DebtSheet
          accounts={accounts}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            invalidate()
          }}
        />
      )}
      {paymentTarget && (
        <PaymentSheet
          debt={paymentTarget}
          accounts={accounts}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            setPaymentTarget(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

function SummaryMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="min-w-0 px-2 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className={cn('truncate text-lg font-bold leading-tight tabular-nums', tone)}>{value}</p>
    </div>
  )
}

function DebtSection({
  title,
  items,
  dimmed,
  onPay,
  onCancel,
  onDelete,
}: {
  title: string
  items: Debt[]
  dimmed?: boolean
  onPay: (debt: Debt) => void
  onCancel: (debt: Debt) => void
  onDelete: (debt: Debt) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="mb-6">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {title} · {items.length}
      </p>
      <div className={cn('flex flex-col gap-3', dimmed && 'opacity-70')}>
        {items.map((debt) => (
          <DebtCard key={debt.id} debt={debt} onPay={() => onPay(debt)} onCancel={() => onCancel(debt)} onDelete={() => onDelete(debt)} />
        ))}
      </div>
    </section>
  )
}

function DebtCard({ debt, onPay, onCancel, onDelete }: { debt: Debt; onPay: () => void; onCancel: () => void; onDelete: () => void }) {
  const inbound = debt.direction === 'OWED_TO_ME'
  const Icon = inbound ? ArrowDownLeft : ArrowUpRight
  const progress = Math.max(0, Math.min(100, Math.round(((debt.originalAmount - debt.outstandingAmount) / debt.originalAmount) * 100)))

  return (
    <article className="rounded-3xl border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(32,28,24,0.075),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-[#292927] dark:bg-[#1c1c1a] dark:shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_12px_28px_rgba(32,28,24,0.09)]',
          inbound ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25' : 'bg-rose-50 text-rose-500 dark:bg-rose-950/25',
        )}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{debt.counterparty}</p>
              <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{debt.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-semibold tabular-nums text-gray-700 dark:text-gray-100">
                {formatMoney(debt.outstandingAmount, debt.currency)}
              </p>
              <p className={cn('text-[11px] font-medium', inbound ? 'text-emerald-600' : 'text-rose-500')}>
                {inbound ? 'por cobrar' : 'por pagar'}
              </p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#252523]">
            <div className={cn('h-full rounded-full', inbound ? 'bg-emerald-500' : 'bg-rose-400')} style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-[#2a2a28]">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">{dueCopy(debt.dueDate)}</p>
              <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                Total {formatMoney(debt.originalAmount, debt.currency)} · {formatDate(debt.dueDate)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {debt.status === 'OPEN' && (
                <>
                  <IconButton title="Registrar pago" onClick={onPay}>
                    <ReceiptText size={14} />
                  </IconButton>
                  <IconButton title="Cancelar" onClick={onCancel}>
                    <Ban size={14} />
                  </IconButton>
                </>
              )}
              <IconButton title="Eliminar" onClick={onDelete} className="text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                <Trash2 size={14} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(32,28,24,0.08)] dark:bg-[#1e1e1c]">
        <HandCoins size={20} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">No hay deudas registradas</p>
      <button onClick={onCreate} className="rounded-full px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20">
        Crear la primera
      </button>
    </div>
  )
}

function DebtSheet({ accounts, onClose, onSuccess }: { accounts: Array<{ id: string; name: string; currency: string }>; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<DebtForm>(defaultDebtForm)
  const createMutation = useMutation({
    mutationFn: debtsApi.create,
    onSuccess: () => {
      toast.success('Deuda creada')
      onSuccess()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo crear la deuda')),
  })

  function setField<K extends keyof DebtForm>(key: K, value: DebtForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectedAccount = accounts.find((account) => account.id === form.accountId)
  const currency = selectedAccount?.currency ?? form.currency

  return (
    <SheetFrame title="Nueva deuda" onClose={onClose}>
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(event) => {
          event.preventDefault()
          createMutation.mutate({
            direction: form.direction,
            counterparty: form.counterparty,
            description: form.description,
            note: form.note || undefined,
            amount: Math.round(Number(form.amount)),
            currency,
            accountId: form.accountId || undefined,
            dueDate: form.dueDate || undefined,
          })
        }}
      >
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-1 dark:bg-[#151513]">
          {[
            { value: 'I_OWE' as const, label: 'Debo' },
            { value: 'OWED_TO_ME' as const, label: 'Me deben' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setField('direction', option.value)}
              className={cn(
                'rounded-full px-3 py-2 text-xs font-semibold transition-all',
                form.direction === option.value
                  ? 'bg-white text-gray-800 shadow-sm dark:bg-[#252523] dark:text-gray-100'
                  : 'text-gray-400 dark:text-gray-500',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Field label="Persona">
          <input value={form.counterparty} onChange={(e) => setField('counterparty', e.target.value)} placeholder="Sofia" className={inputClass} required />
        </Field>
        <Field label="Descripcion">
          <input value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Prestamo almuerzo" className={inputClass} required />
        </Field>
        <div className="grid grid-cols-[1fr_0.45fr] gap-3">
          <Field label="Monto">
            <input type="number" min={1} value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="0" className={inputClass} required />
          </Field>
          <Field label="Moneda">
            <input value={currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())} disabled={!!selectedAccount} className={inputClass} />
          </Field>
        </div>
        <Field label="Cuenta opcional">
          <select value={form.accountId} onChange={(e) => setField('accountId', e.target.value)} className={inputClass}>
            <option value="">No mover dinero</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha limite">
          <input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nota">
          <input value={form.note} onChange={(e) => setField('note', e.target.value)} placeholder="Opcional" className={inputClass} />
        </Field>
        <button disabled={createMutation.isPending} className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a18] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-[#1a1a18]">
          {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
          Crear
        </button>
      </form>
    </SheetFrame>
  )
}

function PaymentSheet({ debt, accounts, onClose, onSuccess }: { debt: Debt; accounts: Array<{ id: string; name: string; currency: string }>; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<PaymentForm>({
    amount: String(debt.outstandingAmount),
    accountId: '',
    paidOn: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const mutation = useMutation({
    mutationFn: () => debtsApi.recordPayment(debt.id, {
      amount: Math.round(Number(form.amount)),
      accountId: form.accountId || undefined,
      paidOn: form.paidOn || undefined,
      note: form.note || undefined,
    }),
    onSuccess: () => {
      toast.success('Pago registrado')
      onSuccess()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo registrar el pago')),
  })

  return (
    <SheetFrame title="Registrar pago" onClose={onClose}>
      <div className="border-b border-gray-100 p-5 dark:border-[#2a2a28]">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{debt.counterparty}</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          Pendiente {formatMoney(debt.outstandingAmount, debt.currency)}
        </p>
      </div>
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <Field label="Monto">
          <input type="number" min={1} max={debt.outstandingAmount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} required />
        </Field>
        <Field label="Cuenta opcional">
          <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className={inputClass}>
            <option value="">No mover dinero</option>
            {accounts.filter((account) => account.currency === debt.currency).map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Nota">
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Opcional" className={inputClass} />
        </Field>
        <button disabled={mutation.isPending} className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a18] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-[#1a1a18]">
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          Guardar pago
        </button>
      </form>
    </SheetFrame>
  )
}

function SheetFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-[0_28px_80px_rgba(32,28,24,0.22)] dark:bg-[#1c1c1a] dark:shadow-2xl sm:m-3 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#2a2a28]">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function IconButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn('flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-[#252523]', className)}
    >
      {children}
    </button>
  )
}

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-[#2a2a28] dark:bg-[#252523] dark:text-gray-200'
