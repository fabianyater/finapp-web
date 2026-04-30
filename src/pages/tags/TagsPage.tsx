import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Check, X, Tag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transactionsApi } from '@/api/transactions'
import { toast } from '@/store/toast'
import PageHeader from '@/components/PageHeader'

export default function TagsPage() {
  const queryClient = useQueryClient()
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['transaction-tags'],
    queryFn: transactionsApi.listTags,
  })

  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingTag, setSavingTag] = useState<string | null>(null)
  const [deletingTag, setDeletingTag] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function startEdit(tag: string) {
    setEditingTag(tag)
    setEditValue(tag)
    setConfirmDelete(null)
  }

  function cancelEdit() {
    setEditingTag(null)
    setEditValue('')
  }

  async function saveEdit(oldTag: string) {
    const newName = editValue.replace(/^#+/, '').trim().toLowerCase()
    if (!newName || newName === oldTag) { cancelEdit(); return }
    setSavingTag(oldTag)
    try {
      await transactionsApi.renameTag(oldTag, newName)
      queryClient.invalidateQueries({ queryKey: ['transaction-tags'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-all'] })
      toast.success(`Tag renombrado a #${newName}`)
      setEditingTag(null)
    } catch {
      toast.error('Error al renombrar el tag')
    } finally {
      setSavingTag(null)
    }
  }

  async function handleDelete(tag: string) {
    if (confirmDelete !== tag) { setConfirmDelete(tag); setEditingTag(null); return }
    setDeletingTag(tag)
    try {
      await transactionsApi.deleteTag(tag)
      queryClient.invalidateQueries({ queryKey: ['transaction-tags'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions-all'] })
      toast.success(`Tag #${tag} eliminado`)
      setConfirmDelete(null)
    } catch {
      toast.error('Error al eliminar el tag')
    } finally {
      setDeletingTag(false as unknown as string)
      setDeletingTag(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <PageHeader title="Tags" />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-[#1a1a18] animate-pulse" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#252523] flex items-center justify-center">
            <Tag size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin tags</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
            Los tags que agregues a tus transacciones aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => {
            const isEditing = editingTag === tag
            const isSaving = savingTag === tag
            const isDeleting = deletingTag === tag
            const isConfirming = confirmDelete === tag

            return (
              <div
                key={tag}
                className={cn(
                  'bg-white dark:bg-[#1a1a18] rounded-xl border px-4 py-3 flex items-center gap-3 transition-all',
                  isConfirming
                    ? 'border-rose-200 dark:border-rose-800'
                    : 'border-gray-100 dark:border-[#2a2a28]',
                )}
              >
                {isEditing ? (
                  <>
                    <span className="text-sm text-gray-400 dark:text-gray-500">#</span>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(tag)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="flex-1 text-sm text-gray-800 dark:text-gray-100 bg-transparent outline-none border-b border-emerald-400 dark:border-emerald-500 pb-0.5"
                    />
                    <button
                      onClick={() => saveEdit(tag)}
                      disabled={isSaving}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                      #{tag}
                    </span>
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-500 dark:text-rose-400">¿Eliminar de todas las transacciones?</span>
                        <button
                          onClick={() => handleDelete(tag)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(tag)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
