import { adminApi } from '@/api/admin'
import PageHeader from '@/components/PageHeader'
import type { AdminMetricsActivityPoint } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  Database,
  Loader2,
  ReceiptText,
  RefreshCw,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'

const integer = new Intl.NumberFormat('es-CO')

function formatDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  })
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminMetricsPage() {
  const metricsQuery = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: adminApi.getMetrics,
    refetchInterval: 60_000,
  })

  if (metricsQuery.isLoading) {
    return (
      <AdminFrame>
        <div className="flex min-h-72 items-center justify-center text-gray-400 dark:text-gray-500">
          <Loader2 size={22} className="animate-spin" />
        </div>
      </AdminFrame>
    )
  }

  if (!metricsQuery.data) {
    const forbidden = isAxiosError(metricsQuery.error)
      && metricsQuery.error.response?.status === 403

    return (
      <AdminFrame>
        <div className="rounded-lg border border-rose-200 bg-white px-5 py-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-[#1c1c1a] dark:text-rose-300">
          {forbidden ? 'Tu usuario no tiene acceso a estas metricas.' : 'No se pudieron cargar las metricas.'}
        </div>
      </AdminFrame>
    )
  }

  const { activity, totals } = metricsQuery.data
  const pendingVerification = Math.max(totals.users - totals.verifiedUsers, 0)
  const activeActivity = activity.reduce((sum, item) => sum + item.transactions, 0)
  const newUsers = activity.reduce((sum, item) => sum + item.newUsers, 0)

  return (
    <AdminFrame>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader title="Metricas admin" back={false} className="mb-1 flex items-center gap-2" />
          <p className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
            Actualizado {formatTimestamp(metricsQuery.data.generatedAt)}
          </p>
        </div>
        <button
          title="Actualizar metricas"
          onClick={() => metricsQuery.refetch()}
          disabled={metricsQuery.isFetching}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-[#2a2a28] dark:bg-[#1c1c1a] dark:text-gray-300 dark:hover:bg-[#252523]"
        >
          {metricsQuery.isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>
      </div>

      <section className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1c1c1a]">
        <div className="grid gap-px bg-gray-100 sm:grid-cols-[1.15fr_0.85fr] dark:bg-[#2a2a28]">
          <SignalCell
            icon={Users}
            label="Usuarios"
            value={totals.users}
            note={`${integer.format(totals.verifiedUsers)} verificados`}
          />
          <SignalCell
            icon={Activity}
            label="Pulso 14 dias"
            value={activeActivity}
            note={`${integer.format(newUsers)} altas nuevas`}
          />
        </div>
        <div className="grid gap-px bg-gray-100 sm:grid-cols-3 dark:bg-[#2a2a28]">
          <LedgerCell icon={BadgeCheck} label="Pendientes de verificar" value={pendingVerification} tone="amber" />
          <LedgerCell icon={Database} label="Cuentas" value={totals.accounts} tone="ink" />
          <LedgerCell icon={ReceiptText} label="Transacciones" value={totals.activeTransactions} tone="green" />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="rounded-lg border border-gray-100 bg-white p-4 dark:border-[#2a2a28] dark:bg-[#1c1c1a]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500">Actividad</p>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Altas y txns recientes</h2>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium tabular-nums text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              {integer.format(activeActivity)} txns
            </span>
          </div>
          <ActivityPulse points={activity} />
        </section>

        <section className="rounded-lg border border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1c1c1a]">
          <p className="border-b border-gray-100 px-4 py-3 text-[10px] font-semibold uppercase text-gray-400 dark:border-[#2a2a28] dark:text-gray-500">
            Registros recurrentes
          </p>
          <MetricRow icon={CalendarClock} label="Recurrentes" value={totals.recurringTransactions} detail={`${integer.format(totals.activeRecurringTransactions)} activas`} />
          <MetricRow icon={WalletCards} label="Suscripciones" value={totals.subscriptions} detail={`${integer.format(totals.activeSubscriptions)} activas`} />
          <MetricRow icon={Trash2} label="Txns borradas" value={totals.deletedTransactions} detail="soft delete" tone="rose" />
        </section>
      </div>
    </AdminFrame>
  )
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f6f1] dark:bg-[#111110]">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</div>
    </div>
  )
}

function SignalCell({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users
  label: string
  value: number
  note: string
}) {
  return (
    <div className="bg-white px-4 py-4 dark:bg-[#1c1c1a]">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
        <Icon size={16} />
      </div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-3xl font-semibold tabular-nums text-gray-950 dark:text-gray-50">{integer.format(value)}</p>
        <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{note}</p>
      </div>
    </div>
  )
}

function LedgerCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: number
  tone: 'amber' | 'green' | 'ink'
}) {
  const tones = {
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30',
    green: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30',
    ink: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-[#252523]',
  }

  return (
    <div className="flex min-w-0 items-center gap-3 bg-white px-4 py-3 dark:bg-[#1c1c1a]">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-gray-100">{integer.format(value)}</p>
      </div>
    </div>
  )
}

function ActivityPulse({ points }: { points: AdminMetricsActivityPoint[] }) {
  const max = Math.max(...points.flatMap((point) => [point.transactions, point.newUsers]), 1)

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[38rem] grid-cols-14 items-end gap-2">
        {points.map((point) => (
          <div key={point.day} className="min-w-0">
            <div className="mb-2 flex h-36 items-end justify-center gap-1 rounded-md bg-gray-50 px-1 dark:bg-[#252523]">
              <PulseBar
                title={`${integer.format(point.newUsers)} usuarios`}
                value={point.newUsers}
                max={max}
                className="bg-amber-400 dark:bg-amber-300"
              />
              <PulseBar
                title={`${integer.format(point.transactions)} transacciones`}
                value={point.transactions}
                max={max}
                className="bg-emerald-500 dark:bg-emerald-400"
              />
            </div>
            <p className="truncate text-center text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
              {formatDay(point.day)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PulseBar({
  title,
  value,
  max,
  className,
}: {
  title: string
  value: number
  max: number
  className: string
}) {
  const height = value === 0 ? '0.35rem' : `max(0.6rem, ${(value / max) * 100}%)`

  return (
    <span
      title={title}
      className={`block w-2 rounded-t-sm opacity-90 ${className}`}
      style={{ height }}
    />
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: typeof Users
  label: string
  value: number
  detail: string
  tone?: 'default' | 'rose'
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-[#2a2a28]">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === 'rose' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-gray-100 text-gray-500 dark:bg-[#252523] dark:text-gray-300'}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-xs tabular-nums text-gray-400 dark:text-gray-500">{detail}</p>
        </div>
      </div>
      <p className="text-lg font-semibold tabular-nums text-gray-950 dark:text-gray-50">{integer.format(value)}</p>
    </div>
  )
}
