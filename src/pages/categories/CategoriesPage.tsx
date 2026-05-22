import { lazy, Suspense, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { EmojiStyle, Theme } from 'emoji-picker-react'
import { Plus, Pencil, Trash2, Loader2, RotateCcw, X, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoriesApi, type CategoryDto } from '@/api/categories'
import { getApiErrorMessage } from '@/lib/apiErrors'
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

const EmojiPicker = lazy(() => import('emoji-picker-react'))

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

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      type: (category?.type as FormData['type']) ?? defaultType,
      icon: category?.icon ? resolveIcon(category.icon) : '📦',
      color: category?.color ? resolveColor(category.color) : '#3b82f6',
    },
  })

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const selectedColor = useWatch({ control, name: 'color' })
  const selectedIcon = useWatch({ control, name: 'icon' })
  const selectedName = useWatch({ control, name: 'name' })

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
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo crear la categoria')),
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
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo actualizar la categoria')),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const labelCls = 'mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400'
  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-[#3a3a38] dark:bg-[#252523] dark:text-gray-100 dark:focus:ring-emerald-950'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1a1a18] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 pb-4 pt-5 backdrop-blur dark:border-[#2a2a28] dark:bg-[#1a1a18]/95">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-4 px-5 pb-8 pt-5">

          {/* type */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-[#2a2a28] dark:bg-[#151513]">
            <label className={labelCls}>Tipo</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-[#252523]">
                  {(['EXPENSE', 'INCOME'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => field.onChange(t)}
                      className={cn(
                        'h-9 rounded-lg text-xs font-semibold transition-colors',
                        field.value === t
                          ? t === 'EXPENSE'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#30302d]'
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
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-[#2a2a28] dark:bg-[#151513]">
            <label className={labelCls}>Nombre</label>
            <div className="flex items-center gap-3">
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((open) => !open)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-2xl shadow-sm transition-colors hover:border-emerald-300 dark:border-[#3a3a38] dark:bg-[#252523]"
                    title="Elegir emoji"
                  >
                    {field.value}
                  </button>
                )}
              />
              <div className="min-w-0 flex-1">
                <input {...register('name')} placeholder="Alimentacion" className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
            </div>
          </div>

          {showEmojiPicker && (
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-[#3a3a38]">
                  <Suspense fallback={<div className="flex h-80 items-center justify-center bg-gray-50 text-xs text-gray-400 dark:bg-[#252523] dark:text-gray-500">Cargando emojis...</div>}>
                    <EmojiPicker
                      width="100%"
                      height={320}
                      theme={'auto' as Theme}
                      emojiStyle={'native' as EmojiStyle}
                      lazyLoadEmojis
                      searchPlaceholder="Buscar emoji"
                      previewConfig={{ showPreview: false }}
                      onEmojiClick={(emoji) => {
                        field.onChange(emoji.emoji)
                        setShowEmojiPicker(false)
                      }}
                    />
                  </Suspense>
                </div>
              )}
            />
          )}

          <div className="rounded-2xl border border-gray-100 p-3 dark:border-[#2a2a28]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${selectedColor}22` }}
              >
                {selectedIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedName || 'Mi categoría'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Color de la categoría</p>
              </div>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex max-w-48 flex-wrap justify-end gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field.onChange(c)}
                        aria-label={`Color ${c}`}
                        className={cn(
                          'h-5 w-5 rounded-full border-2 transition-transform',
                          field.value === c ? 'scale-110 border-gray-900 dark:border-white' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
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
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="group relative flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-[#252523]">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base shadow-[0_1px_1px_rgba(15,23,42,0.05)]"
        style={{ backgroundColor: color + '22' }}
      >
        {resolveIcon(category.icon)}
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">{category.name}</p>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Editar"
          aria-label={`Editar ${category.name}`}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => setShowActions((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#252523] dark:hover:text-gray-300"
          title="Más acciones"
          aria-label={`Más acciones para ${category.name}`}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
      {showActions && (
        <div className="absolute right-2 top-11 z-10 w-32 rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-[#323230] dark:bg-[#1a1a18]">
          <button
            onClick={() => {
              setShowActions(false)
              onDelete()
            }}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <Trash2 size={12} />
            Eliminar
          </button>
        </div>
      )}
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
    <div className="overflow-visible rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.04)] dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:shadow-none">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#2a2a28]">
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

      <div className="divide-y divide-gray-50 px-2 py-1 dark:divide-[#2a2a28]">
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
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo eliminar la categoria')),
  })

  const restoreMutation = useMutation({
    mutationFn: categoriesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-deleted'] })
      setRestoringId(null)
      toast.success('Categoría restaurada')
    },
    onError: (error) => {
      setRestoringId(null)
      toast.error(getApiErrorMessage(error, 'No se pudo restaurar la categoria'))
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
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.04)] dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:shadow-none">
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
