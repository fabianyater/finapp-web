import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoriesApi } from '@/api/categories'
import { budgetsApi, type BudgetDto } from '@/api/budgets'
import { usersApi } from '@/api/users'
import { MoneyInput } from '@/components/MoneyInput'
import PageHeader from '@/components/PageHeader'

const ICON_MAP: Record<string, string> = {
  'currency-dollar': '💰', 'laptop': '💻', 'utensils': '🍽️',
  'car': '🚗', 'home': '🏠', 'paw': '🐾',
  'gamepad': '🎮', 'heart-pulse': '❤️', 'book': '📚',
  'tshirt': '👕', 'plane': '✈️', 'gift': '🎁',
  'shopping-cart': '🛒', 'music': '🎵', 'dumbbell': '🏋️',
  'coffee': '☕', 'pill': '💊', 'baby': '👶',
  'briefcase': '💼', 'graduation-cap': '🎓', 'tree': '🌳',
  'smartphone': '📱', 'tv': '📺', 'wrench': '🔧',
}

function resolveIcon(key?: string) {
  if (!key) return '📦'
  return ICON_MAP[key] ?? key
}

function resolveColor(raw?: string) {
  if (!raw) return '#9ca3af'
  return raw.startsWith('#') ? raw : `#${raw}`
}

function fmtLimit(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BudgetsPage() {
  const queryClient = useQueryClient()
  const [inputs, setInputs] = useState<Record<string, number | ''>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const { data: profile } = useQuery({ queryKey: ['user', 'me'], queryFn: usersApi.getMe })
  const currency = profile?.preferences?.currency ?? 'COP'

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetsApi.list,
  })

  const budgetMap = useMemo(
    () => Object.fromEntries(budgets.map((b) => [b.categoryId, b])) as Record<string, BudgetDto>,
    [budgets],
  )

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE'),
    [categories],
  )

  function getInput(catId: string): number | '' {
    if (catId in inputs) return inputs[catId]
    return budgetMap[catId]?.limitAmount ?? ''
  }

  async function handleSave(catId: string) {
    const val = getInput(catId)
    if (val === '') return
    setSaving((s) => ({ ...s, [catId]: true }))
    try {
      const existing = budgetMap[catId]
      if (existing) {
        await budgetsApi.update(existing.id, val as number)
      } else {
        await budgetsApi.create(catId, val as number)
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setInputs((prev) => { const n = { ...prev }; delete n[catId]; return n })
    } finally {
      setSaving((s) => ({ ...s, [catId]: false }))
    }
  }

  async function handleRemove(catId: string) {
    const existing = budgetMap[catId]
    if (!existing) return
    setSaving((s) => ({ ...s, [catId]: true }))
    try {
      await budgetsApi.remove(existing.id)
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setInputs((prev) => { const n = { ...prev }; delete n[catId]; return n })
    } finally {
      setSaving((s) => ({ ...s, [catId]: false }))
    }
  }

  const isLoading = catsLoading || budgetsLoading
  const withBudget = expenseCategories.filter((c) => budgetMap[c.id] && !(c.id in inputs))
  const withoutBudget = expenseCategories.filter((c) => !budgetMap[c.id] || c.id in inputs)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Presupuestos" />
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 -mt-2">
        Límites mensuales de gasto por categoría.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin text-gray-300 dark:text-gray-600" />
        </div>
      ) : expenseCategories.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">
          No hay categorías de gasto.
        </p>
      ) : (
        <div className="space-y-6">

          {/* ── con límite ─────────────────────────────────── */}
          {withBudget.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Con límite
              </p>
              <div className="space-y-2">
                {withBudget.map((cat) => {
                  const existing = budgetMap[cat.id]!
                  const isSaving = saving[cat.id] ?? false
                  const color = resolveColor(cat.color)

                  return (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          {resolveIcon(cat.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{cat.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                            {fmtLimit(existing.limitAmount, currency)} / mes
                          </p>
                        </div>
                        <button
                          onClick={() => setInputs((prev) => ({ ...prev, [cat.id]: existing.limitAmount }))}
                          className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 px-2 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemove(cat.id)}
                          disabled={isSaving}
                          className="text-[11px] font-medium text-rose-400 hover:text-rose-500 transition-colors disabled:opacity-40 flex-shrink-0 px-2 py-1"
                        >
                          {isSaving ? <Loader2 size={11} className="animate-spin" /> : 'Quitar'}
                        </button>
                      </div>

                      {/* progress bar */}
                      {(() => {
                        const pct = existing.limitAmount > 0 ? existing.spentAmount / existing.limitAmount : 0
                        const isOver = pct > 1
                        const barColor = isOver ? '#ef4444' : color
                        return (
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                                {fmtLimit(existing.spentAmount, currency)} gastado
                              </span>
                              <span
                                className="text-[10px] font-semibold tabular-nums"
                                style={{ color: isOver ? '#ef4444' : 'rgba(107,114,128,0.9)' }}
                              >
                                {Math.round(pct * 100)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#252523] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct * 100, 100)}%`,
                                  backgroundColor: barColor,
                                  opacity: 0.75,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── sin límite / editando ──────────────────────── */}
          {withoutBudget.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Sin límite
              </p>
              <div className="space-y-2">
                {withoutBudget.map((cat) => {
                  const existing = budgetMap[cat.id]
                  const inputVal = getInput(cat.id)
                  const isDirty = cat.id in inputs
                  const isSaving = saving[cat.id] ?? false
                  const color = resolveColor(cat.color)

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {resolveIcon(cat.icon)}
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 truncate">
                        {cat.name}
                      </span>
                      <MoneyInput
                        value={inputVal}
                        onChange={(v) => setInputs((prev) => ({ ...prev, [cat.id]: v }))}
                        currency={currency}
                        placeholder="Sin límite"
                        className={cn(
                          'w-32 text-xs rounded-lg px-2.5 py-1.5 text-right tabular-nums outline-none transition-colors',
                          'bg-gray-800 dark:bg-[#0d0d0c] text-white placeholder-gray-500',
                          'border border-gray-700 dark:border-[#2a2a28] focus:border-gray-500 dark:focus:border-[#4a4a48]',
                        )}
                      />
                      {isDirty && inputVal !== '' && (
                        <button
                          onClick={() => handleSave(cat.id)}
                          disabled={isSaving}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors flex-shrink-0"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                        </button>
                      )}
                      {isDirty && existing && (
                        <button
                          onClick={() => setInputs((prev) => { const n = { ...prev }; delete n[cat.id]; return n })}
                          className="text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
