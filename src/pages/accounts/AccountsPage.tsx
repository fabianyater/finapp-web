import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Archive, Trash2, Loader2, ArchiveRestore, X, Users, UserPlus, UserMinus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountsApi, type AccountDto } from '@/api/accounts'
import { toast } from '@/store/toast'
import PageHeader from '@/components/PageHeader'
import { MoneyInput } from '@/components/MoneyInput'

// ── constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { value: 'CASH', label: 'Efectivo', emoji: '💵' },
  { value: 'BANK', label: 'Banco', emoji: '🏦' },
  { value: 'CREDIT_CARD', label: 'Crédito', emoji: '💳' },
]

const CURRENCIES = ['COP', 'MXN', 'USD', 'EUR', 'ARS', 'GBP']

const ICONS = ['💰', '💳', '🏦', '💵', '🪙', '💼', '🛍️', '✈️', '🏠', '🚗', '🍽️', '📱']

const ICON_TO_KEY: Record<string, string> = {
  '💰': 'currency-dollar', '💳': 'credit-card', '🏦': 'bank',
  '💵': 'cash', '🪙': 'coin', '💼': 'briefcase',
  '🛍️': 'shopping', '✈️': 'plane', '🏠': 'home',
  '🚗': 'car', '🍽️': 'utensils', '📱': 'phone',
}

const KEY_TO_ICON: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_TO_KEY).map(([e, k]) => [k, e])
)

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#000000',
]

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function resolveIcon(key?: string) {
  if (!key) return '💰'
  return KEY_TO_ICON[key] ?? key
}

function typeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type
}

// ── form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(80),
  type: z.enum(['CASH', 'BANK', 'CREDIT_CARD']),
  initialBalance: z.number({ invalid_type_error: 'Ingresa un monto' }),
  currency: z.string().min(1),
  icon: z.string(),
  color: z.string(),
  isDefault: z.boolean(),
  excludeFromTotal: z.boolean(),
})

type FormData = z.infer<typeof schema>

// ── account form sheet ────────────────────────────────────────────────────────

function AccountSheet({
  account,
  onClose,
}: {
  account: AccountDto | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!account

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as FormData['type']) ?? 'CASH',
      initialBalance: account ? account.initialBalance : 0,
      currency: account?.currency ?? 'COP',
      icon: account?.icon ? resolveIcon(account.icon) : '💰',
      color: account?.color ? (account.color.startsWith('#') ? account.color : `#${account.color}`) : '#3b82f6',
      isDefault: account?.isDefault ?? false,
      excludeFromTotal: account?.excludeFromTotal ?? false,
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Cuenta creada')
      onClose()
    },
    onError: () => toast.error('No se pudo crear la cuenta'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => accountsApi.update(account!.id, {
      name: data.name,
      type: data.type,
      initialBalance: Math.round(data.initialBalance),
      icon: ICON_TO_KEY[data.icon] ?? data.icon,
      color: data.color,
      defaultAccount: data.isDefault,
      excludeFromTotal: data.excludeFromTotal,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Cuenta actualizada')
      onClose()
    },
    onError: () => toast.error('No se pudo actualizar la cuenta'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate({
        name: data.name,
        type: data.type,
        initialBalance: Math.round(data.initialBalance),
        icon: ICON_TO_KEY[data.icon] ?? data.icon,
        color: data.color,
        currency: data.currency,
      })
    }
  }

  const inputCls = 'w-full bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors'
  const labelCls = 'block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#1a1a18] rounded-t-2xl border-t border-gray-100 dark:border-[#2a2a28] max-h-[90vh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-[#1a1a18] px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#2a2a28] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-5 pb-10">

          {/* name */}
          <div>
            <label className={labelCls}>Nombre</label>
            <input {...register('name')} placeholder="Mi cuenta" className={inputCls} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* type */}
          <div>
            <label className={labelCls}>Tipo</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => field.onChange(t.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all',
                        field.value === t.value
                          ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]'
                      )}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* balance + currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Saldo inicial</label>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    value={field.value === 0 ? '' : field.value}
                    onChange={(v) => field.onChange(v === '' ? 0 : v)}
                    currency={watch('currency')}
                    className={inputCls}
                  />
                )}
              />
              {errors.initialBalance && <p className="text-red-500 text-xs mt-1">{errors.initialBalance.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      className={cn(inputCls, 'appearance-none pr-8')}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
            </div>
          </div>

          {/* icon */}
          <div>
            <label className={labelCls}>Ícono</label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => field.onChange(emoji)}
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-xl text-lg border transition-all',
                        field.value === emoji
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-gray-200 dark:border-[#3a3a38] hover:border-gray-300 dark:hover:border-[#4a4a48]'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* color */}
          <div>
            <label className={labelCls}>Color</label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        field.value === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          {/* preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252523]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: selectedColor + '22' }}
            >
              {selectedIcon}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Vista previa</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{watch('name') || 'Mi cuenta'}</p>
            </div>
          </div>

          {/* toggles */}
          <div className="space-y-3">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cuenta predeterminada</span>
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative',
                      field.value ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#3a3a38]'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </div>
                </label>
              )}
            />
            <Controller
              name="excludeFromTotal"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Excluir del total</span>
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative',
                      field.value ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#3a3a38]'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </div>
                </label>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── members sheet ─────────────────────────────────────────────────────────────

function MembersSheet({ account, onClose }: { account: AccountDto; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['account-members', account.id],
    queryFn: () => accountsApi.listMembers(account.id),
  })

  const inviteMutation = useMutation({
    mutationFn: (e: string) => accountsApi.inviteMember(account.id, e),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-members', account.id] })
      setEmail('')
      toast.success('Invitación enviada')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      toast.error(msg ?? 'No se pudo invitar al usuario')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => accountsApi.removeMember(account.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-members', account.id] })
      toast.success('Miembro eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el miembro'),
  })

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#1a1a18] rounded-t-2xl border-t border-gray-100 dark:border-[#2a2a28] max-h-[80vh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-[#1a1a18] px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#2a2a28] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Miembros</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{account.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 pb-10">
          {/* invite */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Invitar por correo
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && email && inviteMutation.mutate(email)}
                placeholder="correo@ejemplo.com"
                className="flex-1 bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                onClick={() => email && inviteMutation.mutate(email)}
                disabled={!email || inviteMutation.isPending}
                className="px-3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Invitar
              </button>
            </div>
          </div>

          {/* list */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Miembros con acceso · {members.length}
            </label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-[#252523] rounded-xl animate-pulse" />)}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-3">Sin miembros aún. Invita a alguien arriba.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252523]">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(m.userId)}
                      disabled={removeMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors disabled:opacity-40"
                      title="Quitar miembro"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── account card ──────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onEdit,
  onArchive,
  onDelete,
  onMembers,
}: {
  account: AccountDto
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  onMembers: () => void
}) {
  const color = account.color
    ? (account.color.startsWith('#') ? account.color : `#${account.color}`)
    : '#9ca3af'

  return (
    <div className={cn(
      'bg-white dark:bg-[#1a1a18] border rounded-xl p-4 flex items-center gap-3',
      account.isArchived
        ? 'border-gray-100 dark:border-[#2a2a28] opacity-60'
        : 'border-gray-200 dark:border-[#2a2a28]'
    )}>
      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{account.name}</p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>
          {fmt(account.currentBalance, account.currency)}
        </p>
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onMembers}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Miembros"
        >
          <Users size={14} />
        </button>
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onArchive}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={account.isArchived ? 'Desarchivar' : 'Archivar'}
        >
          {account.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [sheet, setSheet] = useState<'create' | AccountDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AccountDto | null>(null)
  const [membersTarget, setMembersTarget] = useState<AccountDto | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  })

  const accounts = data?.data ?? []
  const active = accounts.filter((a) => !a.isArchived)
  const archived = accounts.filter((a) => a.isArchived)

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived, excludeFromTotal }: { id: string; isArchived: boolean; excludeFromTotal: boolean }) =>
      isArchived ? accountsApi.unarchive(id) : accountsApi.archive(id, excludeFromTotal),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success(vars.isArchived ? 'Cuenta desarchivada' : 'Cuenta archivada')
    },
    onError: () => toast.error('No se pudo actualizar la cuenta'),
  })

  const deleteMutation = useMutation({
    mutationFn: accountsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setDeleteTarget(null)
      toast.success('Cuenta eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la cuenta'),
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Cuentas" className="flex items-center gap-2" />
        <button
          onClick={() => setSheet('create')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
        >
          <Plus size={14} />
          Nueva
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-[#252523] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">No tienes cuentas aún</p>
          <button
            onClick={() => setSheet('create')}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Activas · {active.length}
              </p>
              {active.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  onEdit={() => setSheet(a)}
                  onArchive={() => archiveMutation.mutate({ id: a.id, isArchived: a.isArchived, excludeFromTotal: a.excludeFromTotal })}
                  onDelete={() => setDeleteTarget(a)}
                  onMembers={() => setMembersTarget(a)}
                />
              ))}
            </section>
          )}

          {archived.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Archivadas · {archived.length}
              </p>
              {archived.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  onEdit={() => setSheet(a)}
                  onArchive={() => archiveMutation.mutate({ id: a.id, isArchived: a.isArchived, excludeFromTotal: a.excludeFromTotal })}
                  onDelete={() => setDeleteTarget(a)}
                  onMembers={() => setMembersTarget(a)}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {/* account sheet */}
      {sheet !== null && (
        <AccountSheet
          account={sheet === 'create' ? null : sheet}
          onClose={() => setSheet(null)}
        />
      )}

      {/* members sheet */}
      {membersTarget && (
        <MembersSheet
          account={membersTarget}
          onClose={() => setMembersTarget(null)}
        />
      )}

      {/* delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-x-4 bottom-8 z-50 bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-100 dark:border-[#2a2a28] p-5 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">¿Eliminar cuenta?</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Se eliminará <span className="font-medium text-gray-600 dark:text-gray-300">"{deleteTarget.name}"</span> y todas sus transacciones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
