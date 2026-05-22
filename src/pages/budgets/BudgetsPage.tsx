import { budgetsApi, type BudgetDto } from '@/api/budgets'
import { categoriesApi, type CategoryDto } from '@/api/categories'
import { usersApi } from '@/api/users'
import { MoneyInput } from '@/components/MoneyInput'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const ICON_MAP: Record<string, string> = {
  'currency-dollar': '💰',
  laptop: '💻',
  utensils: '🍽️',
  car: '🚗',
  home: '🏠',
  paw: '🐾',
  gamepad: '🎮',
  'heart-pulse': '❤️',
  book: '📚',
  tshirt: '👕',
  plane: '✈️',
  gift: '🎁',
  'shopping-cart': '🛒',
  music: '🎵',
  dumbbell: '🏋️',
  coffee: '☕',
  pill: '💊',
  baby: '👶',
  briefcase: '💼',
  'graduation-cap': '🎓',
  tree: '🌳',
  smartphone: '📱',
  tv: '📺',
  wrench: '🔧',
}

type BudgetValue = number | ''

function resolveIcon(key?: string) {
  if (!key) return '📦'
  return ICON_MAP[key] ?? key
}

function resolveColor(raw?: string) {
  if (!raw) return '#9ca3af'
  return raw.startsWith('#') ? raw : `#${raw}`
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function shiftMonth(period: Date, delta: number) {
  return new Date(period.getFullYear(), period.getMonth() + delta, 1)
}

function periodParams(period: Date) {
  return { year: period.getFullYear(), month: period.getMonth() + 1 }
}

function budgetState(budget: BudgetDto) {
  const percent = budget.limitAmount > 0 ? budget.spentAmount / budget.limitAmount : 0
  if (percent > 1) return { label: 'Excedido', tone: 'rose', percent }
  if (percent >= 0.8) return { label: 'Cerca del limite', tone: 'amber', percent }
  return { label: 'En rango', tone: 'emerald', percent }
}

export default function BudgetsPage() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<BudgetValue>('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newLimit, setNewLimit] = useState<BudgetValue>('')

  const { data: profile } = useQuery({ queryKey: ['user', 'me'], queryFn: usersApi.getMe })
  const currency = profile?.preferences?.currency ?? 'COP'

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', periodParams(period)],
    queryFn: () => budgetsApi.list(periodParams(period)),
  })

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'EXPENSE'),
    [categories],
  )
  const budgetMap = useMemo(
    () => Object.fromEntries(budgets.map((budget) => [budget.categoryId, budget])) as Record<string, BudgetDto>,
    [budgets],
  )
  const availableCategories = expenseCategories.filter((category) => !budgetMap[category.id])
  const totals = useMemo(() => {
    const limit = budgets.reduce((sum, budget) => sum + budget.limitAmount, 0)
    const spent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
    return {
      limit,
      spent,
      remaining: limit - spent,
      exceeded: budgets.filter((budget) => budget.spentAmount > budget.limitAmount).length,
    }
  }, [budgets])
  const isLoading = categoriesLoading || budgetsLoading

  async function saveBudget(categoryId: string, limit: BudgetValue, existing?: BudgetDto) {
    if (limit === '' || limit <= 0) return
    setSavingId(existing?.id ?? categoryId)
    try {
      if (existing) {
        await budgetsApi.update(existing.id, limit)
      } else {
        await budgetsApi.create(categoryId, limit)
      }
      await queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setEditingId(null)
      setEditValue('')
      setAdding(false)
      setNewLimit('')
      setNewCategoryId('')
    } finally {
      setSavingId(null)
    }
  }

  async function removeBudget(budget: BudgetDto) {
    setSavingId(budget.id)
    try {
      await budgetsApi.remove(budget.id)
      await queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setActionId(null)
    } finally {
      setSavingId(null)
    }
  }

  function startEdit(budget: BudgetDto) {
    setActionId(null)
    setEditingId(budget.id)
    setEditValue(budget.limitAmount)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
      <PageHeader title="Presupuestos" />

      <div className="-mt-1 mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Limites mensuales de gasto.</p>
          <p className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-100">
            {new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(period)}
          </p>
        </div>
        <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-[#2a2a28] dark:bg-[#1a1a18]">
          <button
            onClick={() => setPeriod((value) => shiftMonth(value, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setPeriod((value) => shiftMonth(value, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin text-gray-300 dark:text-gray-600" />
        </div>
      ) : expenseCategories.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
          No hay categorias de gasto.
        </p>
      ) : (
        <div className="space-y-4">
          <BudgetSummary currency={currency} totals={totals} count={budgets.length} />

          <section className="overflow-visible rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.04)] dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:shadow-none">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#2a2a28]">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Presupuestos activos</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{budgets.length} categorias con limite</p>
              </div>
              {availableCategories.length > 0 && (
                <button
                  onClick={() => {
                    setAdding((open) => !open)
                    setNewCategoryId((value) => value || availableCategories[0].id)
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus size={13} />
                  Agregar
                </button>
              )}
            </div>

            {adding && availableCategories.length > 0 && (
              <BudgetCreateRow
                categories={availableCategories}
                categoryId={newCategoryId || availableCategories[0].id}
                value={newLimit}
                currency={currency}
                saving={savingId === (newCategoryId || availableCategories[0].id)}
                onCategoryChange={setNewCategoryId}
                onValueChange={setNewLimit}
                onSave={() => saveBudget(newCategoryId || availableCategories[0].id, newLimit)}
                onCancel={() => {
                  setAdding(false)
                  setNewLimit('')
                }}
              />
            )}

            {budgets.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                Agrega el primer presupuesto para controlar el mes.
              </p>
            ) : (
              <div className="divide-y divide-gray-50 px-2 py-1 dark:divide-[#2a2a28]">
                {budgets.map((budget) => (
                  <BudgetRow
                    key={budget.id}
                    budget={budget}
                    currency={currency}
                    editing={editingId === budget.id}
                    editValue={editValue}
                    actionsOpen={actionId === budget.id}
                    saving={savingId === budget.id}
                    onEdit={() => startEdit(budget)}
                    onEditValue={setEditValue}
                    onSave={() => saveBudget(budget.categoryId, editValue, budget)}
                    onCancelEdit={() => {
                      setEditingId(null)
                      setEditValue('')
                    }}
                    onToggleActions={() => setActionId((id) => id === budget.id ? null : budget.id)}
                    onRemove={() => removeBudget(budget)}
                  />
                ))}
              </div>
            )}
          </section>

          {availableCategories.length > 0 && !adding && (
            <p className="px-1 text-xs text-gray-400 dark:text-gray-500">
              {availableCategories.length} categorias de gasto aun no tienen limite.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function BudgetSummary({
  currency,
  totals,
  count,
}: {
  currency: string
  totals: { limit: number; spent: number; remaining: number; exceeded: number }
  count: number
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.04)] dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:shadow-none">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Presupuestado" value={fmt(totals.limit, currency)} />
        <Metric label="Gastado" value={fmt(totals.spent, currency)} />
        <Metric label={totals.remaining < 0 ? 'Excedente' : 'Disponible'} value={fmt(Math.abs(totals.remaining), currency)} alert={totals.remaining < 0} />
        <Metric label="Excedidos" value={`${totals.exceeded} / ${count}`} alert={totals.exceeded > 0} />
      </div>
    </section>
  )
}

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p className={cn('mt-1 truncate text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100', alert && 'text-rose-600 dark:text-rose-400')}>
        {value}
      </p>
    </div>
  )
}

function BudgetCreateRow({
  categories,
  categoryId,
  value,
  currency,
  saving,
  onCategoryChange,
  onValueChange,
  onSave,
  onCancel,
}: {
  categories: CategoryDto[]
  categoryId: string
  value: BudgetValue
  currency: string
  saving: boolean
  onCategoryChange: (value: string) => void
  onValueChange: (value: BudgetValue) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="grid gap-2 border-b border-gray-100 bg-gray-50/70 p-3 dark:border-[#2a2a28] dark:bg-[#151513] sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
      <select
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-emerald-400 dark:border-[#3a3a38] dark:bg-[#252523] dark:text-gray-100"
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <MoneyInput value={value} onChange={onValueChange} currency={currency} placeholder="Limite" className={moneyInputCls} />
      <InlineActions saving={saving} disabled={value === ''} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}

const moneyInputCls = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-right text-sm tabular-nums text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-400 dark:border-[#3a3a38] dark:bg-[#252523] dark:text-gray-100'

function BudgetRow({
  budget,
  currency,
  editing,
  editValue,
  actionsOpen,
  saving,
  onEdit,
  onEditValue,
  onSave,
  onCancelEdit,
  onToggleActions,
  onRemove,
}: {
  budget: BudgetDto
  currency: string
  editing: boolean
  editValue: BudgetValue
  actionsOpen: boolean
  saving: boolean
  onEdit: () => void
  onEditValue: (value: BudgetValue) => void
  onSave: () => void
  onCancelEdit: () => void
  onToggleActions: () => void
  onRemove: () => void
}) {
  const color = resolveColor(budget.categoryColor)
  const status = budgetState(budget)
  const remaining = budget.limitAmount - budget.spentAmount
  const fillColor = status.tone === 'rose' ? '#ef4444' : status.tone === 'amber' ? '#f59e0b' : color

  return (
    <article className="relative space-y-2.5 rounded-xl px-2 py-3 hover:bg-gray-50 dark:hover:bg-[#252523]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${color}20` }}>
          {resolveIcon(budget.categoryIcon)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{budget.categoryName}</p>
            <StatusPill label={status.label} tone={status.tone} />
          </div>
          {editing ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <MoneyInput value={editValue} onChange={onEditValue} currency={currency} className={moneyInputCls} />
              <InlineActions saving={saving} disabled={editValue === ''} onSave={onSave} onCancel={onCancelEdit} />
            </div>
          ) : (
            <p className="mt-0.5 text-xs tabular-nums text-gray-400 dark:text-gray-500">
              Limite {fmt(budget.limitAmount, currency)} por mes
            </p>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-[#1a1a18] dark:hover:text-gray-200"
              title="Editar limite"
              aria-label={`Editar limite de ${budget.categoryName}`}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onToggleActions}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-[#1a1a18] dark:hover:text-gray-200"
              title="Mas acciones"
              aria-label={`Mas acciones para ${budget.categoryName}`}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>

      {!editing && (
        <>
          <div className="grid gap-1 text-[11px] font-medium sm:grid-cols-2">
            <p className="tabular-nums text-gray-500 dark:text-gray-400">{fmt(budget.spentAmount, currency)} gastado</p>
            <p className={cn('tabular-nums sm:text-right', remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400')}>
              {remaining < 0 ? `${fmt(Math.abs(remaining), currency)} por encima` : `${fmt(remaining, currency)} disponible`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-[#151513]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(status.percent * 100, 100)}%`, backgroundColor: fillColor, opacity: 0.78 }}
              />
            </div>
            <span className="w-10 text-right text-[10px] font-semibold tabular-nums text-gray-400 dark:text-gray-500">
              {Math.round(status.percent * 100)}%
            </span>
          </div>
        </>
      )}

      {actionsOpen && (
        <div className="absolute right-2 top-12 z-10 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-[#323230] dark:bg-[#1a1a18]">
          <button
            onClick={onRemove}
            disabled={saving}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Quitar limite
          </button>
        </div>
      )}
    </article>
  )
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold',
        tone === 'rose' && 'bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-300',
        tone === 'amber' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-300',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300',
      )}
    >
      {tone !== 'emerald' && <AlertTriangle size={10} />}
      {label}
    </span>
  )
}

function InlineActions({
  saving,
  disabled,
  onSave,
  onCancel,
}: {
  saving: boolean
  disabled: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
        aria-label="Guardar presupuesto"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
      </button>
      <button
        onClick={onCancel}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:border-[#3a3a38] dark:hover:bg-[#252523] dark:hover:text-gray-200"
        aria-label="Cancelar"
      >
        <X size={14} />
      </button>
    </div>
  )
}
