import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, RotateCcw, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoriesApi, type CategoryDto } from '@/api/categories'
import { toast } from '@/store/toast'
import PageHeader from '@/components/PageHeader'

// ── constants ─────────────────────────────────────────────────────────────────

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

const ICON_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_MAP).map(([k, v]) => [v, k])
)

const ICONS = Object.values(ICON_MAP)

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#64748b', '#a16207', '#9f1239', '#155e75',
]

function resolveIcon(key?: string) {
  if (!key) return '📦'
  return ICON_MAP[key] ?? key
}

function resolveColor(raw?: string) {
  if (!raw) return '#9ca3af'
  return raw.startsWith('#') ? raw : `#${raw}`
}

// ── schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(80),
  type: z.enum(['EXPENSE', 'INCOME']),
  icon: z.string(),
  color: z.string(),
})
type FormData = z.infer<typeof schema>

// ── category sheet ────────────────────────────────────────────────────────────

function CategorySheet({
  category,
  defaultType,
  onClose,
}: {
  category: CategoryDto | null
  defaultType: 'EXPENSE' | 'INCOME'
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!category

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      type: (category?.type as FormData['type']) ?? defaultType,
      icon: category?.icon ? resolveIcon(category.icon) : '📦',
      color: category?.color ? resolveColor(category.color) : '#3b82f6',
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const createMutation = useMutation({
    mutationFn: (d: FormData) => categoriesApi.create({
      name: d.name, type: d.type,
      icon: ICON_TO_KEY[d.icon] ?? d.icon,
      color: d.color,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoría creada')
      onClose()
    },
    onError: () => toast.error('No se pudo crear la categoría'),
  })

  const updateMutation = useMutation({
    mutationFn: (d: FormData) => categoriesApi.update(category!.id, {
      name: d.name, type: d.type,
      icon: ICON_TO_KEY[d.icon] ?? d.icon,
      color: d.color,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoría actualizada')
      onClose()
    },
    onError: () => toast.error('No se pudo actualizar la categoría'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const labelCls = 'block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5'
  const inputCls = 'w-full bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#1a1a18] rounded-t-2xl border-t border-gray-100 dark:border-[#2a2a28] max-h-[90vh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-[#1a1a18] px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#2a2a28] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d))} className="px-5 py-5 space-y-5 pb-10">

          {/* type */}
          <div>
            <label className={labelCls}>Tipo</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {(['EXPENSE', 'INCOME'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => field.onChange(t)}
                      className={cn(
                        'py-2.5 rounded-xl border text-xs font-semibold transition-all',
                        field.value === t
                          ? t === 'EXPENSE'
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                            : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48]'
                      )}
                    >
                      {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* name */}
          <div>
            <label className={labelCls}>Nombre</label>
            <input {...register('name')} placeholder="Alimentación" className={inputCls} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* icon */}
          <div>
            <label className={labelCls}>Ícono</label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="space-y-3">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">O escribe un emoji:</span>
                    <input
                      type="text"
                      value={ICONS.includes(field.value) ? '' : field.value}
                      onChange={(e) => {
                        const val = [...e.target.value].slice(-2).join('')
                        if (val) field.onChange(val)
                      }}
                      placeholder="🌟"
                      className="w-16 text-center text-lg bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg py-1.5 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                    />
                  </div>
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
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{watch('name') || 'Mi categoría'}</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </form>
      </div>
    </>
  )
}

// ── category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryDto
  onEdit: () => void
  onDelete: () => void
}) {
  const color = resolveColor(category.color)

  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        {resolveIcon(category.icon)}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{category.name}</p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── deleted row ───────────────────────────────────────────────────────────────

function DeletedRow({
  category,
  onRestore,
  isRestoring,
}: {
  category: CategoryDto
  onRestore: () => void
  isRestoring: boolean
}) {
  const color = resolveColor(category.color)

  return (
    <div className="flex items-center gap-3 py-3 px-1 opacity-60">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        {resolveIcon(category.icon)}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{category.name}</p>
      <button
        onClick={onRestore}
        disabled={isRestoring}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#3a3a38] text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
      >
        {isRestoring ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
        Restaurar
      </button>
    </div>
  )
}

// ── section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  accent,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string
  accent: string
  items: CategoryDto[]
  onAdd: () => void
  onEdit: (c: CategoryDto) => void
  onDelete: (c: CategoryDto) => void
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#2a2a28] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{items.length}</span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <Plus size={13} />
          Agregar
        </button>
      </div>

      <div className="px-4 divide-y divide-gray-50 dark:divide-[#2a2a28]">
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Sin categorías</p>
        ) : (
          items.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [sheet, setSheet] = useState<{ category: CategoryDto | null; defaultType: 'EXPENSE' | 'INCOME' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const { data: deletedCategories = [] } = useQuery({
    queryKey: ['categories-deleted'],
    queryFn: categoriesApi.listDeleted,
    enabled: showDeleted,
  })

  const expenses = categories.filter((c) => c.type === 'EXPENSE')
  const incomes = categories.filter((c) => c.type === 'INCOME')

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-deleted'] })
      setDeleteTarget(null)
      toast.success('Categoría eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la categoría'),
  })

  const restoreMutation = useMutation({
    mutationFn: categoriesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-deleted'] })
      setRestoringId(null)
      toast.success('Categoría restaurada')
    },
    onError: () => {
      setRestoringId(null)
      toast.error('No se pudo restaurar la categoría')
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <PageHeader title="Categorías" />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-gray-100 dark:bg-[#252523] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          <Section
            title="Gastos"
            accent="#f43f5e"
            items={expenses}
            onAdd={() => setSheet({ category: null, defaultType: 'EXPENSE' })}
            onEdit={(c) => setSheet({ category: c, defaultType: 'EXPENSE' })}
            onDelete={setDeleteTarget}
          />

          <Section
            title="Ingresos"
            accent="#10b981"
            items={incomes}
            onAdd={() => setSheet({ category: null, defaultType: 'INCOME' })}
            onEdit={(c) => setSheet({ category: c, defaultType: 'INCOME' })}
            onDelete={setDeleteTarget}
          />

          {/* deleted section */}
          <div className="bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDeleted((v) => !v)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
            >
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Eliminadas</span>
              {showDeleted ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
            </button>

            {showDeleted && (
              <div className="px-4 border-t border-gray-100 dark:border-[#2a2a28] divide-y divide-gray-50 dark:divide-[#2a2a28]">
                {deletedCategories.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">No hay categorías eliminadas</p>
                ) : (
                  deletedCategories.map((c) => (
                    <DeletedRow
                      key={c.id}
                      category={c}
                      isRestoring={restoringId === c.id}
                      onRestore={() => {
                        setRestoringId(c.id)
                        restoreMutation.mutate(c.id)
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* sheet */}
      {sheet !== null && (
        <CategorySheet
          category={sheet.category}
          defaultType={sheet.defaultType}
          onClose={() => setSheet(null)}
        />
      )}

      {/* delete confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-x-4 bottom-8 z-50 bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-100 dark:border-[#2a2a28] p-5 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">¿Eliminar categoría?</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              <span className="font-medium text-gray-600 dark:text-gray-300">"{deleteTarget.name}"</span> se eliminará. Puedes restaurarla después desde la sección de eliminadas.
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
