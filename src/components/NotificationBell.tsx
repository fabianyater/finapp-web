import { useRef, useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import { invitationsApi } from '@/api/invitations'
import { cn } from '@/lib/utils'
import type { NotificationItem } from '@/types'

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

function InviteNotification({ n, onDone }: { n: NotificationItem; onDone: () => void }) {
  const invitationId = n.metadata.invitationId as string | undefined

  const accept = useMutation({
    mutationFn: () => invitationsApi.accept(invitationId!),
    onSuccess: onDone,
  })

  const decline = useMutation({
    mutationFn: () => invitationsApi.decline(invitationId!),
    onSuccess: onDone,
  })

  const isPending = accept.isPending || decline.isPending

  return (
    <div className={cn(
      'px-4 py-3 border-b border-gray-50 dark:border-[#252523] last:border-0',
      n.unread ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
    )}>
      <div className="flex items-start gap-2">
        {n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
        <div className={cn('flex-1 min-w-0', !n.unread && 'pl-3.5')}>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
          {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{fmtRelative(n.createdAt)}</p>
          {invitationId && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => accept.mutate()}
                disabled={isPending}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold disabled:opacity-50 transition-colors"
              >
                <Check size={11} />
                Aceptar
              </button>
              <button
                onClick={() => decline.mutate()}
                disabled={isPending}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-[#3a3a38] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] text-[11px] font-semibold disabled:opacity-50 transition-colors"
              >
                <X size={11} />
                Rechazar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: count = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getRecent(20),
    enabled: open,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    qc.invalidateQueries({ queryKey: ['accounts'] })
  }

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: invalidateAll,
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: invalidateAll,
  })

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
        title="Notificaciones"
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl shadow-xl z-50 flex flex-col max-h-[480px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#2a2a28] flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificaciones</span>
            {count > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                Sin notificaciones
              </div>
            ) : (
              notifications.map((n) => {
                if (n.type === 'ACCOUNT_INVITE') {
                  return (
                    <InviteNotification
                      key={n.id}
                      n={n}
                      onDone={() => {
                        notificationsApi.markRead(n.id).catch(() => {})
                        invalidateAll()
                      }}
                    />
                  )
                }
                return (
                  <button
                    key={n.id}
                    onClick={() => { if (n.unread) markRead.mutate(n.id) }}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-gray-50 dark:border-[#252523] last:border-0 transition-colors',
                      n.unread
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-[#252523]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                      <div className={cn('flex-1 min-w-0', !n.unread && 'pl-3.5')}>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{fmtRelative(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
