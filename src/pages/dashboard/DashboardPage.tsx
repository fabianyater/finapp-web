import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  ChevronLeft,
  X,
  BarChart2,
  Receipt,
  Search,
  Trash2,
  Settings,
  Tag,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  RepeatIcon,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoneyInput } from '@/components/MoneyInput'
import { useAuthStore } from '@/store/auth'
import UserMenu from '@/components/UserMenu'
import NotificationBell from '@/components/NotificationBell'
import { accountsApi, type AccountDto } from '@/api/accounts'
import { transactionsApi, type TransactionListDto, type DeletedTransactionDto, type ParseTransactionResponse } from '@/api/transactions'
import { categoriesApi, type CategoryDto, type CategorySummaryDto } from '@/api/categories'
import { budgetsApi, type BudgetDto } from '@/api/budgets'
import { useThemeStore } from '@/store/theme'

// ─── constants ───────────────────────────────────────────────────────────────

const BAR_COLORS = [
  '#f97316', '#3b82f6', '#7c3aed', '#f43f5e', '#f59e0b',
  '#14b8a6', '#6366f1', '#ec4899', '#84cc16', '#10b981',
]

const ICON_MAP: Record<string, string> = {
  'currency-dollar': '💰',
  'laptop': '💻',
  'utensils': '🍽️',
  'car': '🚗',
  'home': '🏠',
  'paw': '🐾',
  'gamepad': '🎮',
  'heart-pulse': '❤️',
  'book': '📚',
  'tshirt': '👕',
  'plane': '✈️',
  'gift': '🎁',
}

function resolveIcon(icon?: string) {
  if (!icon) return '📦'
  return ICON_MAP[icon] ?? icon
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtShort(amount: number) {
  if (amount >= 1_000_000) return `${+(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${+(amount / 1_000).toFixed(1)}k`
  return `${amount}`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function iconBg(hex: string) {
  const h = hex.startsWith('#') ? hex : `#${hex}`
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.14)`
}

function resolveColor(raw?: string, fallback = '#9ca3af') {
  if (!raw) return fallback
  return raw.startsWith('#') ? raw : `#${raw}`
}

// ─── month helpers ────────────────────────────────────────────────────────────

function monthRange(year: number, month: number) {
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── month picker popover ─────────────────────────────────────────────────────

function MonthPicker({
  year, month, onSelect, onClose,
}: {
  year: number
  month: number
  onSelect: (y: number, m: number) => void
  onClose: () => void
}) {
  const now = new Date()
  const [pickerYear, setPickerYear] = useState(year)

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-100 dark:border-[#2a2a28] shadow-lg p-4 w-56">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPickerYear(y => y - 1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{pickerYear}</span>
          <button
            onClick={() => setPickerYear(y => y + 1)}
            disabled={pickerYear >= now.getFullYear()}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_SHORT.map((name, i) => {
            const isFuture = pickerYear > now.getFullYear() || (pickerYear === now.getFullYear() && i > now.getMonth())
            const isSelected = pickerYear === year && i === month
            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => { onSelect(pickerYear, i); onClose() }}
                className={cn(
                  'py-1.5 rounded-lg text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : isFuture
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]',
                )}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── tag input ───────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  function commit(raw: string) {
    const tag = raw.replace(/^#+/, '').trim().toLowerCase()
    if (!tag || tags.includes(tag)) { setInput(''); return }
    onChange([...tags, tag])
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(input) }
    if (e.key === 'Backspace' && !input && tags.length > 0) onChange(tags.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] min-h-[40px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#1a1a18] text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => commit(input)}
        placeholder={tags.length === 0 ? '#cafe, #mercado...' : ''}
        className="flex-1 min-w-[80px] outline-none text-xs text-gray-700 dark:text-gray-200 bg-transparent placeholder-gray-300 dark:placeholder-gray-600"
      />
    </div>
  )
}

// ─── empty states ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#252523] flex items-center justify-center mb-1">
        <Icon size={18} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
    </div>
  )
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252523] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-100 dark:bg-[#252523] rounded-full w-2/5" />
        <div className="h-2.5 bg-gray-100 dark:bg-[#252523] rounded-full w-1/4" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-[#252523] rounded-full w-16" />
    </div>
  )
}

// ─── category bars ────────────────────────────────────────────────────────────

const BAR_AREA_H = 320
const MAX_BAR_H = 300
const MIN_BAR_H = 52

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function CategoryBars({
  items,
  barColor,
  selectedId,
  onSelect,
  budgets,
}: {
  items: CategorySummaryDto[]
  barColor: string
  selectedId: string | null
  onSelect: (id: string) => void
  budgets?: Record<string, BudgetDto>
}) {
  const { mode } = useThemeStore()
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const fillOpacity = isDark ? { normal: 0.07, selected: 0.13 } : { normal: 0.28, selected: 0.38 }

  const maxAmount = Math.max(
    ...items.map((i) => {
      const b = budgets?.[i.categoryId]
      return b ? Math.max(i.total, b.limitAmount) : i.total
    }),
    1,
  )
  const hasSelection = selectedId !== null

  return (
    <div
      className="flex items-end gap-3 overflow-x-auto scrollbar-hide"
      style={{ height: `${BAR_AREA_H}px` }}
    >
      {items.map(({ categoryId, icon, total, color: rawColor }, i) => {
        const budget = budgets?.[categoryId]
        const catColor = rawColor ? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`) : null
        const isSelected = categoryId === selectedId
        const isDimmed = hasSelection && !isSelected
        const hoverOn = (e: React.MouseEvent<HTMLDivElement>) => {
          if (!isDimmed) { e.currentTarget.style.transform = 'scaleX(1.06) scaleY(1.02)'; e.currentTarget.style.filter = 'brightness(1.08)' }
        }
        const hoverOff = (e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''
        }

        if (budget) {
          // ── track / pista style ───────────────────────────
          const pct = total / budget.limitAmount
          const isOverBudget = total > budget.limitAmount
          const baseColor = catColor ?? barColor
          const trackH = Math.max(MIN_BAR_H, Math.round((budget.limitAmount / maxAmount) * MAX_BAR_H))
          const fillH  = Math.round((total / maxAmount) * MAX_BAR_H)
          const containerH = Math.max(trackH, fillH)
          const remainH = Math.max(0, trackH - fillH)
          const borderColor = isSelected ? 'rgba(156,163,175,0.55)' : 'rgba(156,163,175,0.3)'

          return (
            <div
              key={categoryId}
              onClick={() => onSelect(categoryId)}
              className="bar-grow relative flex-shrink-0 cursor-pointer"
              style={{
                width: '64px',
                height: `${containerH}px`,
                animationDelay: `${i * 55}ms`,
                transition: 'transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease',
                opacity: isDimmed ? 0.35 : 1,
              }}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              {/* under budget: dashed border only on the empty zone above the fill */}
              {!isOverBudget && (
                <div
                  className="absolute inset-x-0 pointer-events-none"
                  style={{
                    bottom: `${fillH}px`,
                    height: `${remainH > 0 ? remainH : trackH}px`,
                    backgroundColor: 'rgba(156,163,175,0.04)',
                    borderTop: `2px dashed ${borderColor}`,
                    borderLeft: `2px dashed ${borderColor}`,
                    borderRight: `2px dashed ${borderColor}`,
                    borderBottom: fillH <= 0 ? `2px dashed ${borderColor}` : 'none',
                    borderRadius: fillH <= 0 ? '14px' : '14px 14px 0 0',
                  }}
                />
              )}

              {/* over budget: dashed border wraps the entire bar */}
              {isOverBudget && fillH > 0 && (
                <div
                  className="absolute bottom-0 inset-x-0 rounded-2xl pointer-events-none"
                  style={{
                    height: `${fillH}px`,
                    border: `2px dashed ${borderColor}`,
                  }}
                />
              )}

              {/* solid fill — grows above track when over budget */}
              {fillH > 0 && (
                <div
                  className="absolute bottom-0 inset-x-0"
                  style={{
                    height: `${fillH}px`,
                    backgroundColor: hexToRgba(baseColor, isSelected ? fillOpacity.selected : fillOpacity.normal),
                    borderRadius: remainH > 0 ? '0 0 14px 14px' : '14px',
                    transition: 'height 0.45s ease, background-color 0.2s ease',
                  }}
                />
              )}

              {/* text pinned to bottom, always readable */}
              <div className="absolute bottom-2 inset-x-0 flex flex-col items-center gap-0.5 pointer-events-none z-10">
                <span className="text-sm leading-none select-none">{resolveIcon(icon)}</span>
                <span
                  className="text-sm font-bold tabular-nums leading-none"
                  style={{ color: isOverBudget ? '#ef4444' : '#ffffff' }}
                >
                  {fmtShort(total)}
                </span>
                <span
                  className="text-[9px] font-semibold tabular-nums leading-none"
                  style={{ color: isOverBudget ? '#ef4444' : 'rgba(107,114,128,0.8)' }}
                >
                  {isSelected && isOverBudget
                    ? `+${fmtShort(total - budget.limitAmount)}`
                    : `${Math.round(pct * 100)}%`}
                </span>
              </div>
            </div>
          )
        }

        // ── sin presupuesto: barra creciente normal ────────
        const rawBarH = Math.round((total / maxAmount) * MAX_BAR_H)
        const barH = Math.max(MIN_BAR_H, rawBarH)
        const color = catColor ?? barColor

        return (
          <div
            key={categoryId}
            onClick={() => onSelect(categoryId)}
            className="bar-grow relative flex-shrink-0 rounded-xl flex flex-col items-center justify-end pb-2 gap-0.5 cursor-pointer"
            style={{
              width: '64px',
              height: `${barH}px`,
              backgroundColor: hexToRgba(color, isSelected ? fillOpacity.selected : fillOpacity.normal),
              border: `2px solid ${isSelected ? 'rgba(156,163,175,0.55)' : 'rgba(156,163,175,0.3)'}`,
              animationDelay: `${i * 55}ms`,
              transition: 'transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
              opacity: isDimmed ? 0.35 : 1,
            }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <span className="text-sm leading-none select-none">{resolveIcon(icon)}</span>
            <span className="text-sm font-bold tabular-nums leading-none" style={{ color: '#ffffff' }}>
              {fmtShort(total)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── transfer detail modal ────────────────────────────────────────────────────

function TransferDetailModal({
  tx,
  accounts,
  currency,
  onClose,
  onDeleted,
}: {
  tx: TransactionListDto
  accounts: AccountDto[]
  currency: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOut = tx.toAccountId != null
  const fromName = isOut
    ? accounts.find((a) => a.id === tx.accountId)?.name ?? tx.accountId
    : accounts.find((a) => a.id === tx.toAccountId ?? '')?.name ?? '—'
  const toName = isOut
    ? accounts.find((a) => a.id === tx.toAccountId)?.name ?? tx.toAccountId
    : accounts.find((a) => a.id === tx.accountId)?.name ?? tx.accountId

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await transactionsApi.removeTransfer(tx.accountId, tx.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#2a2a28] last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-right">{value}</span>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[90vh]">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Transferencia</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2">
            {row('Origen', fromName)}
            {row('Destino', toName)}
            {row('Monto', <span className="text-blue-500 font-semibold">{fmt(tx.amount, currency)}</span>)}
            {row('Fecha', new Date(tx.occurredOn).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }))}
            {tx.description && row('Descripción', tx.description)}
            {tx.note && row('Nota', tx.note)}
          </div>

          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-[#2a2a28]">
            {!confirmDelete ? (
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar transferencia
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">Se revertirá el balance en ambas cuentas</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── transfer modal ───────────────────────────────────────────────────────────

function TransferModal({
  accounts,
  defaultFromAccountId,
  onClose,
  onSuccess,
}: {
  accounts: AccountDto[]
  defaultFromAccountId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [fromAccountId, setFromAccountId] = useState(defaultFromAccountId)
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toOptions = accounts.filter((a) => a.id !== fromAccountId)

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !toAccountId) {
      setError('Completa todos los campos requeridos')
      return
    }
    if (fromAccountId === toAccountId) {
      setError('La cuenta origen y destino deben ser diferentes')
      return
    }
    setLoading(true)
    setError('')
    try {
      await transactionsApi.createTransfer({
        fromAccountId,
        toAccountId,
        amount: Math.round(Number(amount)),
        description: description || undefined,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
      })
      onSuccess()
    } catch {
      setError('Error al crear la transferencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col">
          <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a28]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Transferencia</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Cuenta origen</label>
              <select
                value={fromAccountId}
                onChange={(e) => { setFromAccountId(e.target.value); setToAccountId('') }}
                className={inputCls}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({fmt(a.currentBalance, a.currency)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Cuenta destino</label>
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={inputCls} required>
                <option value="">Selecciona una cuenta...</option>
                {toOptions.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({fmt(a.currentBalance, a.currency)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Monto ({fromAccount?.currency ?? 'COP'})
              </label>
              <MoneyInput
                value={amount}
                onChange={setAmount}
                currency={fromAccount?.currency ?? 'COP'}
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                Descripción <span className="font-normal text-gray-400">(opcional)</span>
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
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>

            {error && <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Transfiriendo...' : 'Transferir'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── add transaction modal ────────────────────────────────────────────────────

const AI_NEW_CATEGORY = '__ai_new__'

function AddTransactionModal({
  accountId,
  categories,
  initialDescription,
  currency,
  onClose,
  onSuccess,
  aiParsed,
}: {
  accountId: string
  categories: CategoryDto[]
  initialDescription: string
  currency: string
  onClose: () => void
  onSuccess: () => void
  aiParsed?: ParseTransactionResponse | null
}) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(aiParsed?.type ?? 'EXPENSE')
  const [amount, setAmount] = useState<number | ''>(aiParsed?.amount ?? '')
  const [description, setDescription] = useState(aiParsed?.description ?? initialDescription)
  const [note, setNote] = useState(aiParsed?.note ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState(() => {
    if (aiParsed?.categoryId) return aiParsed.categoryId
    if (aiParsed?.newCategory) return AI_NEW_CATEGORY
    return ''
  })
  const [date, setDate] = useState(aiParsed?.occurredOn ?? new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = categories.filter((c) => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !categoryId) {
      setError('Completa todos los campos requeridos')
      return
    }
    setLoading(true)
    setError('')
    try {
      let resolvedCategoryId = categoryId

      if (categoryId === AI_NEW_CATEGORY && aiParsed?.newCategory) {
        const nc = aiParsed.newCategory
        const newId = await categoriesApi.create({ name: nc.name, icon: nc.icon, color: nc.color, type })
        resolvedCategoryId = newId
      }

      await transactionsApi.create(accountId, {
        type,
        amount: Math.round(Number(amount)),
        description,
        note: note || undefined,
        categoryId: resolvedCategoryId,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
        tags: tags.length > 0 ? tags : undefined,
      })
      onSuccess()
    } catch {
      setError('Error al crear la transacción')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors'

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* modal — fixed height, never resizes */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col h-[500px]">

          {/* header — fixed */}
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

          {/* scrollable form body */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

              {/* type toggle */}
              <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-[#252523] rounded-xl">
                {(['EXPENSE', 'INCOME'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategoryId('') }}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all',
                      type === t
                        ? t === 'EXPENSE'
                          ? 'bg-white dark:bg-[#1a1a18] text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'bg-white dark:bg-[#1a1a18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                    )}
                  >
                    {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                  </button>
                ))}
              </div>

              {/* amount */}
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

              {/* description */}
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

              {/* category */}
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
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        categoryId === AI_NEW_CATEGORY
                          ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-dashed border-gray-300 dark:border-[#4a4a48] text-gray-500 dark:text-gray-400',
                      )}
                    >
                      <Sparkles size={10} />
                      {aiParsed.newCategory.icon} {aiParsed.newCategory.name}
                    </button>
                  )}
                  {filtered.length === 0 && !aiParsed?.newCategory ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Sin categorías de tipo {type === 'EXPENSE' ? 'gasto' : 'ingreso'}.{' '}
                      <Link to="/categories" className="text-emerald-600 dark:text-emerald-400 underline">
                        Crea una
                      </Link>
                    </p>
                  ) : (
                    filtered.map((cat) => {
                      const color = resolveColor(cat.color)
                      const selected = categoryId === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            selected
                              ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]',
                          )}
                          style={selected ? {} : { borderLeftColor: color, borderLeftWidth: '3px' }}
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* date */}
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

              {/* note */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Nota <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agrega un detalle..."
                  className={inputCls}
                />
              </div>

              {/* tags */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Tags <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar transacción'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── transaction detail modal ────────────────────────────────────────────────

function TransactionDetailModal({
  tx,
  category,
  accountName,
  currency,
  categories,
  onClose,
  onDeleted,
  onUpdated,
}: {
  tx: TransactionListDto
  category: { name: string; color: string; icon: string } | undefined
  accountName: string
  currency: string
  categories: CategoryDto[]
  onClose: () => void
  onDeleted: () => void
  onUpdated: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // edit form state
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>((tx.type === 'TRANSFER' ? 'EXPENSE' : tx.type) as 'EXPENSE' | 'INCOME')
  const [amount, setAmount] = useState<number | ''>(tx.amount)
  const [description, setDescription] = useState(tx.description)
  const [note, setNote] = useState(tx.note ?? '')
  const [tags, setTags] = useState<string[]>(tx.tags ?? [])
  const [categoryId, setCategoryId] = useState(tx.categoryId)
  const [date, setDate] = useState(tx.occurredOn.slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isIncome = tx.type === 'INCOME'
  const color = resolveColor(category?.color)
  const filteredCats = categories.filter((c) => c.type === type)

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await transactionsApi.remove(tx.accountId, tx.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  async function handleSave() {
    if (!amount || !description || !categoryId) { setError('Completa todos los campos requeridos'); return }
    setSaving(true)
    setError('')
    try {
      await transactionsApi.update(tx.accountId, tx.id, {
        type,
        amount: Math.round(Number(amount)),
        description,
        note: note || undefined,
        occurredOn: new Date(`${date}T12:00:00`).toISOString(),
        categoryId,
        tags: tags.length > 0 ? tags : undefined,
      })
      onUpdated()
    } catch {
      setError('Error al guardar los cambios')
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#252523] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors'

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-[#2a2a28] last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-right">{value}</span>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#1a1a18] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[90vh]">

          {/* header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a28]">
            {isEditing ? (
              <button
                onClick={() => { setIsEditing(false); setError('') }}
                className="flex items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={14} />
                Detalle
              </button>
            ) : (
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Detalle</span>
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
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {isEditing ? (
            /* ── edit form ── */
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="px-5 py-4 space-y-4">
                {/* type toggle */}
                <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-[#252523] rounded-xl">
                  {(['EXPENSE', 'INCOME'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setType(t); setCategoryId('') }}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all',
                        type === t
                          ? t === 'EXPENSE'
                            ? 'bg-white dark:bg-[#1a1a18] text-rose-600 dark:text-rose-400 shadow-sm'
                            : 'bg-white dark:bg-[#1a1a18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                      )}
                    >
                      {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                    </button>
                  ))}
                </div>

                {/* amount */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Monto ({currency})</label>
                  <MoneyInput value={amount} onChange={setAmount} currency={currency} className={inputCls} />
                </div>

                {/* description */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Descripción</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿En qué?" className={inputCls} />
                </div>

                {/* category */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {filteredCats.map((cat) => {
                      const col = resolveColor(cat.color)
                      const selected = categoryId === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            selected
                              ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]',
                          )}
                          style={selected ? {} : { borderLeftColor: col, borderLeftWidth: '3px' }}
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Fecha</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </div>

                {/* note */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nota <span className="text-gray-300 dark:text-gray-600">(opcional)</span></label>
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agrega una nota..." className={inputCls} />
                </div>

                {/* tags */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Tags <span className="text-gray-300 dark:text-gray-600">(opcional)</span></label>
                  <TagInput tags={tags} onChange={setTags} />
                </div>

                {error && <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            /* ── detail view ── */
            <>
              <div className="flex flex-col items-center gap-2 pt-6 pb-4 px-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl leading-none mb-1"
                  style={{ backgroundColor: iconBg(color) }}
                >
                  {resolveIcon(category?.icon)}
                </div>
                <span className={cn(
                  'text-2xl font-bold tabular-nums',
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
                )}>
                  {isIncome ? '+' : '-'}{fmt(tx.amount, currency)}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">{tx.description}</span>
              </div>

              <div className="px-5 pb-2">
                {row('Tipo', (
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[11px] font-semibold',
                    isIncome
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
                  )}>
                    {isIncome ? 'Ingreso' : 'Gasto'}
                  </span>
                ))}
                {row('Categoría', (
                  <span className="flex items-center gap-1.5">
                    <span>{resolveIcon(category?.icon)}</span>
                    {category?.name ?? '—'}
                  </span>
                ))}
                {row('Fecha', fmtDateFull(tx.occurredOn))}
                {row('Cuenta', accountName)}
                {tx.note && row('Nota', tx.note)}
                {tx.tags && tx.tags.length > 0 && row('Tags', (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {tx.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-[#252523] text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 pt-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50',
                    confirmDelete
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-gray-100 dark:bg-[#252523] text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30',
                  )}
                >
                  {deleting ? 'Eliminando...' : confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar transacción'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── tx grouping ─────────────────────────────────────────────────────────────

function localDateKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupByDay(txs: TransactionListDto[]) {
  const map = new Map<string, TransactionListDto[]>()
  for (const tx of txs) {
    const day = localDateKey(tx.occurredOn)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(tx)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

function dayTotal(txs: TransactionListDto[], typeFilter: 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER') {
  if (typeFilter === 'TRANSFER') return 0
  if (typeFilter === 'INCOME') return txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  if (typeFilter === 'EXPENSE') return txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  return income - expense
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const now = new Date()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParseTransactionResponse | null>(null)
  const [categoryView, setCategoryView] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [showPicker, setShowPicker] = useState(false)

  const [balanceVisible, setBalanceVisible] = useState(
    () => localStorage.getItem('balanceVisible') !== 'false'
  )
  const [showAllTxns, setShowAllTxns] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [txSearchInput, setTxSearchInput] = useState('')
  const [txSearch, setTxSearch] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL')
  const [txPage, setTxPage] = useState(0)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTx, setSelectedTx] = useState<TransactionListDto | null>(null)
  const [selectedTransferTx, setSelectedTransferTx] = useState<TransactionListDto | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { dateFrom, dateTo } = monthRange(selYear, selMonth)
  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth()

  function prevMonth() {
    if (selMonth === 0) { setSelYear(y => y - 1); setSelMonth(11) }
    else setSelMonth(m => m - 1)
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (selMonth === 11) { setSelYear(y => y + 1); setSelMonth(0) }
    else setSelMonth(m => m + 1)
  }
  async function handleExportCsv() {
    if (!selectedAccountId || isExporting) return
    setIsExporting(true)
    try {
      const blob = await transactionsApi.exportCsv({
        accountIds: [selectedAccountId],
        dateFrom,
        dateTo,
        search: txSearch || undefined,
        types: txTypeFilter !== 'ALL' ? [txTypeFilter] : undefined,
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transactions.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const txSectionRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const t = setTimeout(() => setTxSearch(txSearchInput), 350)
    return () => clearTimeout(t)
  }, [txSearchInput])

  useEffect(() => { setTxPage(0) }, [txSearch, txTypeFilter, selectedCategoryId, selectedAccountId, selYear, selMonth, selectedTags])


  useEffect(() => { setSelectedCategoryId(null) }, [selectedAccountId, selYear, selMonth])

  // ── data ──────────────────────────────────────────────────────────────────

  const { data: accountsData, isLoading: accountsLoading, isFetching: accountsFetching, isError: accountsError } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  })
  const accounts: AccountDto[] = (accountsData?.data ?? []).filter((a) => !a.isArchived)

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const def = accounts.find((a) => a.isDefault) ?? accounts[0]
      setSelectedAccountId(def.id)
    }
  }, [accounts, selectedAccountId])

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', selectedAccountId, dateFrom, dateTo],
    queryFn: () =>
      transactionsApi.list({
        accountIds: selectedAccountId ? [selectedAccountId] : undefined,
        size: 100,
        dateFrom,
        dateTo,
      }),
    enabled: !!selectedAccountId,
  })
  const transactions = txData?.data ?? []

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const { data: summaryCats = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['category-summary', selectedAccountId, categoryView, dateFrom, dateTo],
    queryFn: () => categoriesApi.getSummary(selectedAccountId!, categoryView, dateFrom, dateTo),
    enabled: !!selectedAccountId,
  })

  const { data: allTxData, isLoading: allTxLoading } = useQuery({
    queryKey: ['transactions-all', selectedAccountId, dateFrom, dateTo, txSearch, txTypeFilter, selectedCategoryId, selectedTags, txPage],
    queryFn: () =>
      transactionsApi.list({
        accountIds: selectedAccountId ? [selectedAccountId] : undefined,
        page: txPage,
        size: 15,
        dateFrom,
        dateTo,
        search: txSearch || undefined,
        types: txTypeFilter !== 'ALL' ? [txTypeFilter] : undefined,
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }),
    enabled: !!selectedAccountId && showAllTxns,
    placeholderData: keepPreviousData,
  })

  const { data: availableTags = [] } = useQuery({
    queryKey: ['transaction-tags'],
    queryFn: transactionsApi.listTags,
    enabled: !!selectedAccountId && showAllTxns,
  })

  const { data: deletedTxs = [], isLoading: deletedLoading } = useQuery({
    queryKey: ['transactions-deleted', selectedAccountId],
    queryFn: () => transactionsApi.listDeleted(selectedAccountId!),
    enabled: !!selectedAccountId && showDeleted,
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(),
    enabled: !!selectedAccountId,
  })

  const budgetMap = useMemo(
    () => Object.fromEntries(budgets.map((b) => [b.categoryId, b])) as Record<string, BudgetDto>,
    [budgets],
  )

  // ── computed ──────────────────────────────────────────────────────────────

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const currency = selectedAccount?.currency ?? 'COP'

  const includedAccounts = accounts.filter((a) => !a.excludeFromTotal)
  const totalByCurrency = includedAccounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + a.currentBalance
    return acc
  }, {})

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0)
  const balance = selectedAccount?.currentBalance ?? 0

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  function resolveCat(tx: { categoryId?: string | null; categoryName?: string | null; categoryColor?: string | null; categoryIcon?: string | null }) {
    if (!tx.categoryId) return undefined
    return categoryMap.get(tx.categoryId) ?? (tx.categoryName ? { name: tx.categoryName, color: tx.categoryColor ?? '#64748b', icon: tx.categoryIcon ?? 'tag' } : undefined)
  }

  const recentTxs = transactions.slice(0, 10)

  // ── input handlers ────────────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleSubmitInput = async () => {
    if (!selectedAccountId) return
    const text = input.trim()
    if (!text) {
      setParsedData(null)
      setShowModal(true)
      return
    }
    setIsParsing(true)
    try {
      const result = await transactionsApi.parseTransaction(text)
      setParsedData(result)
    } catch {
      setParsedData(null)
    } finally {
      setIsParsing(false)
      setShowModal(true)
    }
  }

  const handleSuccess = () => {
    setShowModal(false)
    setParsedData(null)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
    queryClient.invalidateQueries({ queryKey: ['category-summary', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const handleTransferSuccess = () => {
    setShowTransfer(false)
    queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }

  const handleTxDeleted = () => {
    setSelectedTx(null)
    queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
    queryClient.invalidateQueries({ queryKey: ['transactions-all', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['category-summary', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const handleTxUpdated = () => {
    setSelectedTx(null)
    queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
    queryClient.invalidateQueries({ queryKey: ['transactions-all', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['category-summary', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const handleRestore = async (tx: DeletedTransactionDto) => {
    await transactionsApi.restore(tx.accountId, tx.id)
    queryClient.invalidateQueries({ queryKey: ['transactions-deleted', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
    queryClient.invalidateQueries({ queryKey: ['transactions-all', selectedAccountId] })
    queryClient.invalidateQueries({ queryKey: ['category-summary', selectedAccountId] })
  }

  // ── no accounts ───────────────────────────────────────────────────────────

  if (accountsLoading || (accountsFetching && !accountsData)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-[#252523] rounded-full w-1/3" />
        <div className="h-16 bg-gray-100 dark:bg-[#252523] rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#252523] rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 dark:bg-[#252523] rounded-xl" />
      </div>
    )
  }

  if (accountsError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">No se pudo cargar la información.</p>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (!accountsLoading && !accountsFetching && accounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-2">
          <Wallet size={22} className="text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Sin cuentas</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Crea tu primera cuenta para empezar a registrar transacciones
        </p>
        <Link
          to="/accounts"
          className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
        >
          Crear cuenta
        </Link>
      </div>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

      {/* ── top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">finapp</span>
        <div className="flex items-center gap-1.5">
          <Link
            to="/recurring"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Transacciones recurrentes"
          >
            <RepeatIcon size={17} />
          </Link>
          <Link
            to="/settings"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Configuración"
          >
            <Settings size={17} />
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* ── total balance ────────────────────────────────── */}
      {includedAccounts.length > 0 && (
        <div className="px-1 py-2">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Saldo total</p>
            <button
              onClick={() => setBalanceVisible(v => { const next = !v; localStorage.setItem('balanceVisible', String(next)); return next })}
              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {balanceVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {Object.entries(totalByCurrency).map(([cur, total]) => (
              <span key={cur} className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 tabular-nums">
                {balanceVisible
                  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total)
                  : '••••••'}
              </span>
            ))}
          </div>
          {includedAccounts.length < accounts.length && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              {accounts.length - includedAccounts.length} cuenta{accounts.length - includedAccounts.length > 1 ? 's' : ''} excluida{accounts.length - includedAccounts.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── account selector ─────────────────────────────── */}
      {accounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {accounts.map((account) => {
            const acColor = resolveColor(account.color)
            const isSelected = selectedAccountId === account.id
            return (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] text-gray-600 dark:text-gray-400',
                )}
                style={isSelected ? { backgroundColor: acColor } : {}}
              >
                {account.name}
              </button>
            )
          })}
          <Link
            to="/accounts"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] text-gray-400 dark:text-gray-500 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-500 transition-all self-center"
          >
            <Plus size={14} />
          </Link>
        </div>
      )}

      {/* ── transaction input ─────────────────────────────── */}
      <div className="bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-200 dark:border-[#2a2a28] shadow-sm px-4 py-3 flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          placeholder="Escribe una transacción..."
          rows={1}
          className="flex-1 resize-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent leading-6 overflow-hidden"
          style={{ minHeight: '24px', maxHeight: '120px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmitInput()
            }
          }}
        />
        {accounts.length >= 2 && (
          <button
            onClick={() => setShowTransfer(true)}
            title="Transferencia entre cuentas"
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-gray-100 dark:bg-[#252523] text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <ArrowLeftRight size={15} />
          </button>
        )}
        <button
          onClick={handleSubmitInput}
          disabled={isParsing}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
            input.trim()
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
              : 'bg-gray-100 dark:bg-[#252523] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2f2f2d]',
            isParsing && 'opacity-70 cursor-not-allowed',
          )}
        >
          {isParsing ? <Loader2 size={15} className="animate-spin" /> : input.trim() ? <ArrowRight size={15} /> : <Plus size={15} />}
        </button>
      </div>

      {/* ── month selector ───────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-all"
        >
          <ChevronLeft size={15} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowPicker(p => !p)}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252523]"
          >
            {MONTH_NAMES[selMonth]} {selYear}
          </button>
          {showPicker && (
            <MonthPicker
              year={selYear}
              month={selMonth}
              onSelect={(y, m) => { setSelYear(y); setSelMonth(m) }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── summary cards ────────────────────────────────── */}
      {selectedAccount && (
        <div className="grid grid-cols-3 gap-3 fade-in">
          <button
            type="button"
            onClick={() => setCategoryView('INCOME')}
            className={cn(
              'text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-95',
              categoryView === 'INCOME'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-sm'
                : 'bg-white dark:bg-[#1a1a18] border-gray-100 dark:border-[#2a2a28] hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-sm hover:-translate-y-px',
            )}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Ingresos</span>
            </div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight tabular-nums">
              {balanceVisible ? fmt(totalIncome, currency) : '••••••'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCategoryView('EXPENSE')}
            className={cn(
              'text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-95',
              categoryView === 'EXPENSE'
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm'
                : 'bg-white dark:bg-[#1a1a18] border-gray-100 dark:border-[#2a2a28] hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-sm hover:-translate-y-px',
            )}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown size={12} className="text-rose-400" />
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Gastos</span>
            </div>
            <p className="text-sm font-bold text-rose-500 dark:text-rose-400 leading-tight tabular-nums">
              {balanceVisible ? fmt(totalExpense, currency) : '••••••'}
            </p>
          </button>

          <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wallet size={12} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Balance</span>
            </div>
            <p
              className={cn(
                'text-sm font-bold leading-tight tabular-nums',
                balance >= 0
                  ? 'text-gray-800 dark:text-gray-100'
                  : 'text-rose-500 dark:text-rose-400',
              )}
            >
              {balanceVisible ? fmt(balance, currency) : '••••••'}
            </p>
          </div>
        </div>
      )}

      {/* ── category breakdown ───────────────────────────── */}
      {selectedAccountId && (
        <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] overflow-hidden">
          <div className="px-4 pt-4 pb-0 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {categoryView === 'EXPENSE' ? 'Gastos por categoría' : 'Ingresos por categoría'}
            </p>
            <div className="flex items-center gap-3">
              {categoryView === 'EXPENSE' && (
                <Link
                  to="/budgets"
                  className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Presupuestos
                </Link>
              )}
              <Link
                to="/categories"
                className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <Tag size={11} />
                Categorías
              </Link>
            </div>
          </div>

          <div className="px-5 pt-3 pb-4" style={{ height: `${BAR_AREA_H + 28}px` }}>
            {summaryLoading ? (
              <div className="flex items-end gap-3 h-full">
                {[52, 90, 120, 70, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-xl bg-gray-100 dark:bg-[#252523] animate-pulse"
                    style={{ width: '54px', height: `${h}px` }}
                  />
                ))}
              </div>
            ) : summaryCats.length > 0 ? (
              <CategoryBars
                items={summaryCats}
                barColor={categoryView === 'EXPENSE' ? '#f87171' : '#34d399'}
                selectedId={selectedCategoryId}
                budgets={categoryView === 'EXPENSE' ? budgetMap : undefined}
                onSelect={(id) => {
                  const next = selectedCategoryId === id ? null : id
                  setSelectedCategoryId(next)
                  if (next) {
                    setShowAllTxns(true)
                    setTimeout(() => txSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  } else {
                    setShowAllTxns(false)
                  }
                  setTxPage(0)
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={BarChart2}
                  title={categoryView === 'EXPENSE' ? 'Sin gastos registrados' : 'Sin ingresos registrados'}
                  sub="Registra transacciones para ver el desglose"
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── transactions ─────────────────────────────────── */}
      <div ref={txSectionRef}>
        {/* header row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!showDeleted) {
                  setShowDeleted(true)
                  setShowAllTxns(false)
                } else {
                  setShowDeleted(false)
                }
              }}
              className={cn(
                'w-6 h-6 flex items-center justify-center rounded-lg transition-colors',
                showDeleted
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300',
              )}
              title="Ver eliminadas"
            >
              <Trash2 size={13} />
            </button>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {showDeleted ? 'Eliminadas' : showAllTxns ? 'Transacciones' : 'Recientes'}
            </p>
          </div>
          {!showDeleted && (showAllTxns ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                title="Exportar CSV"
              >
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              </button>
              <button
                onClick={() => {
                  setShowAllTxns(false)
                  setTxSearchInput('')
                  setTxSearch('')
                  setTxTypeFilter('ALL')
                  setTxPage(0)
                  setSelectedCategoryId(null)
                  setSelectedTags([])
                }}
                className="flex items-center gap-0.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={12} />
                Recientes
              </button>
            </div>
          ) : recentTxs.length > 0 && (
            <button
              onClick={() => {
                setShowAllTxns(true)
                setTimeout(() => txSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
              }}
              className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Ver todas
              <ChevronRight size={12} />
            </button>
          ))}
        </div>

        {/* search + type filter — only in "all" mode */}
        {!showDeleted && showAllTxns && (
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={txSearchInput}
                onChange={(e) => setTxSearchInput(e.target.value)}
                placeholder="Buscar transacciones..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a28] bg-white dark:bg-[#1a1a18] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              />
            </div>
            {selectedCategoryId && (() => {
              const cat = categoryMap.get(selectedCategoryId)
              return (
                <button
                  onClick={() => { setSelectedCategoryId(null); setShowAllTxns(false); setTxPage(0) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200 w-fit"
                  style={{ borderLeft: `3px solid ${resolveColor(cat?.color)}` }}
                >
                  <span>{resolveIcon(cat?.icon)}</span>
                  {cat?.name ?? 'Categoría'}
                  <X size={11} className="text-gray-400 dark:text-gray-500 ml-0.5" />
                </button>
              )
            })()}

            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    txTypeFilter === t
                      ? t === 'EXPENSE'
                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        : t === 'INCOME'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : t === 'TRANSFER'
                        ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-[#252523] text-gray-700 dark:text-gray-200'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523]',
                  )}
                >
                  {t === 'ALL' ? 'Todos' : t === 'EXPENSE' ? 'Gastos' : t === 'INCOME' ? 'Ingresos' : 'Transferencias'}
                </button>
              ))}
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isActive = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags(isActive ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag])}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                        isActive
                          ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400'
                          : 'bg-gray-100 dark:bg-[#252523] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2f2f2d]',
                      )}
                    >
                      #{tag}
                      {isActive && <X size={9} className="ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* deleted transactions list */}
        {showDeleted && (() => {
          if (deletedLoading) {
            return (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
                    <SkeletonRow />
                  </div>
                ))}
              </div>
            )
          }

          if (deletedTxs.length === 0) {
            return (
              <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
                <EmptyState
                  icon={Trash2}
                  title="Sin transacciones eliminadas"
                  sub="Las transacciones eliminadas de esta cuenta aparecerán aquí"
                />
              </div>
            )
          }

          return (
            <div className="space-y-2">
              {deletedTxs.map((tx) => {
                const cat = resolveCat(tx)
                const color = resolveColor(cat?.color)
                const isIncome = tx.type === 'INCOME'
                const deletedLabel = fmtDate(tx.deletedAt)

                return (
                  <div
                    key={tx.id}
                    className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 flex items-center gap-3 opacity-70"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none"
                      style={{ backgroundColor: iconBg(color) }}
                    >
                      {resolveIcon(cat?.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Eliminada {deletedLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400',
                        )}
                      >
                        {isIncome ? '+' : '-'}
                        {fmt(tx.amount, currency)}
                      </span>
                      <button
                        onClick={() => handleRestore(tx)}
                        className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      >
                        Restaurar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* list */}
        {!showDeleted && (() => {
          const loading = showAllTxns ? allTxLoading : txLoading
          const txList = showAllTxns ? (allTxData?.data ?? []) : recentTxs

          if (loading) {
            return (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
                    <SkeletonRow />
                  </div>
                ))}
              </div>
            )
          }

          if (txList.length === 0) {
            return (
              <div className="bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28]">
                <EmptyState
                  icon={Receipt}
                  title="Sin transacciones"
                  sub={showAllTxns && (txSearch || txTypeFilter !== 'ALL' || selectedTags.length > 0 || selectedCategoryId) ? 'No hay resultados para este filtro' : 'Las transacciones de esta cuenta aparecerán aquí'}
                />
              </div>
            )
          }

          const activeFilter = showAllTxns ? txTypeFilter : 'ALL'
          const groups = groupByDay(txList)
          let globalIdx = 0

          return (
            <div className="space-y-4">
              {groups.map(([day, dayTxs]) => {
                const total = dayTotal(dayTxs, activeFilter)
                const isNet = activeFilter === 'ALL'
                const isTransferFilter = activeFilter === 'TRANSFER'
                const totalColor = isTransferFilter
                  ? 'text-blue-500 dark:text-blue-400'
                  : isNet
                  ? total >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                  : activeFilter === 'INCOME'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400'
                const totalPrefix = isTransferFilter ? '' : isNet ? (total >= 0 ? '+' : '') : activeFilter === 'INCOME' ? '+' : '-'

                return (
                  <div key={day}>
                    {/* day header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                        {fmtDate(`${day}T12:00:00`)}
                      </span>
                      {!isTransferFilter && (
                        <span className={cn('text-[11px] font-semibold tabular-nums', totalColor)}>
                          {totalPrefix}{fmt(Math.abs(total), currency)}
                        </span>
                      )}
                    </div>

                    {/* transactions for this day */}
                    <div className="space-y-2">
                      {dayTxs.map((tx) => {
                        const idx = globalIdx++
                        const isTransfer = tx.type === 'TRANSFER'
                        const cat = isTransfer ? undefined : resolveCat(tx)
                        const color = isTransfer ? '#3b82f6' : resolveColor(cat?.color)
                        const isIncome = tx.type === 'INCOME'
                        const isOut = isTransfer && tx.toAccountId != null
                        const toAccountName = isTransfer && tx.toAccountId
                          ? accounts.find((a) => a.id === tx.toAccountId)?.name ?? tx.toAccountId
                          : null

                        return (
                          <div
                            key={tx.id}
                            onClick={() => isTransfer ? setSelectedTransferTx(tx) : setSelectedTx(tx)}
                            className={cn(
                              'fade-up bg-white dark:bg-[#1a1a18] rounded-xl border border-gray-100 dark:border-[#2a2a28] px-4 py-3 flex items-center gap-3 transition-all duration-200',
                              'hover:-translate-y-px hover:shadow-sm hover:border-gray-200 dark:hover:border-[#3a3a38] cursor-pointer',
                            )}
                            style={{ animationDelay: `${idx * 40}ms` }}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none"
                              style={{ backgroundColor: iconBg(color) }}
                            >
                              {isTransfer ? <ArrowLeftRight size={16} style={{ color }} /> : resolveIcon(cat?.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                {tx.description}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {isTransfer
                                  ? (isOut ? `Hacia ${toAccountName}` : 'Transferencia recibida')
                                  : (cat?.name ?? '—')}
                                {tx.createdBy && (
                                  <span className="ml-1 opacity-60">· {tx.createdBy}</span>
                                )}
                              </p>
                              {tx.tags && tx.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tx.tags.map((tag) => (
                                    <span key={tag} className="px-1.5 py-px rounded text-[9px] font-medium bg-gray-100 dark:bg-[#252523] text-gray-400 dark:text-gray-500">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-sm font-semibold flex-shrink-0 tabular-nums',
                                isTransfer
                                  ? isOut
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-blue-500 dark:text-blue-400'
                                  : isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500 dark:text-rose-400',
                              )}
                            >
                              {isTransfer ? (isOut ? '→' : '←') : (isIncome ? '+' : '-')}
                              {fmt(tx.amount, currency)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* pagination — only in "all" mode */}
        {!showDeleted && showAllTxns && allTxData && allTxData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 px-1">
            <button
              onClick={() => setTxPage((p) => p - 1)}
              disabled={txPage === 0}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft size={12} />
              Anterior
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {txPage + 1} / {allTxData.meta.totalPages}
            </span>
            <button
              onClick={() => setTxPage((p) => p + 1)}
              disabled={!allTxData.meta.hasNext}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Siguiente
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── modal ────────────────────────────────────────── */}
      {showModal && selectedAccountId && (
        <AddTransactionModal
          accountId={selectedAccountId}
          categories={categories}
          initialDescription={input}
          currency={currency}
          onClose={() => { setShowModal(false); setParsedData(null) }}
          onSuccess={handleSuccess}
          aiParsed={parsedData}
        />
      )}

      {showTransfer && selectedAccountId && (
        <TransferModal
          accounts={accounts}
          defaultFromAccountId={selectedAccountId}
          onClose={() => setShowTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          category={resolveCat(selectedTx) as { name: string; color: string; icon: string } | undefined}
          accountName={selectedAccount?.name ?? '—'}
          currency={currency}
          categories={categories}
          onClose={() => setSelectedTx(null)}
          onDeleted={handleTxDeleted}
          onUpdated={handleTxUpdated}
        />
      )}
      {selectedTransferTx && (
        <TransferDetailModal
          tx={selectedTransferTx}
          accounts={accounts}
          currency={currency}
          onClose={() => setSelectedTransferTx(null)}
          onDeleted={() => {
            setSelectedTransferTx(null)
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions', selectedAccountId, dateFrom, dateTo] })
            queryClient.invalidateQueries({ queryKey: ['transactions-all', selectedAccountId] })
            queryClient.invalidateQueries({ queryKey: ['category-summary', selectedAccountId] })
          }}
        />
      )}
    </div>
  )
}
