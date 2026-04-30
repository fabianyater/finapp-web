import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from '@/store/toast'
import { usersApi } from '@/api/users'
import { useThemeStore, type ThemeMode } from '@/store/theme'
import { ChevronDown, ChevronRight, Loader2, Sun, Moon, Monitor, Wallet, Tag, Hash, RepeatIcon, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'

// ── Schemas ────────────────────────────────────────────────────────────────

const preferencesSchema = z.object({
  currency: z.string(),
  language: z.string(),
  dateFormat: z.string(),
})

type PreferencesForm = z.infer<typeof preferencesSchema>

// ── Options ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'MXN', label: 'MXN — Peso mexicano' },
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — Libra esterlina' },
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'COP', label: 'COP — Peso colombiano' },
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const THEMES: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0 inline-block" />
      {message}
    </p>
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
      />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { mode: themeMode, setMode: setTheme } = useThemeStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: usersApi.getMe,
  })

  // ── Preferences form ──────────────────────────────────────────────────

  const {
    register: regPrefs,
    handleSubmit: submitPrefs,
    reset: resetPrefs,
    formState: { errors: prefsErrors },
  } = useForm<PreferencesForm>({ resolver: zodResolver(preferencesSchema) })

  useEffect(() => {
    if (profile?.preferences) resetPrefs(profile.preferences)
  }, [profile, resetPrefs])

  const prefsMutation = useMutation({
    mutationFn: usersApi.updatePreferences,
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'me'], updated)
      toast.success('Preferencias guardadas')
    },
    onError: () => {
      toast.error('No se pudieron guardar las preferencias')
    },
  })

  const themeMutation = useMutation({
    mutationFn: (theme: ThemeMode) => usersApi.updatePreferences({ theme }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'me'], updated)
    },
  })

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode)
    themeMutation.mutate(mode)
  }

  // ── Shared styles ─────────────────────────────────────────────────────

  const selectCls =
    'w-full appearance-none bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-9'

  const cardCls =
    'bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl overflow-hidden'

  const cardHeaderCls =
    'px-6 py-5 border-b border-gray-100 dark:border-[#2a2a28]'

  const saveBtnCls =
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2'

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-20">
      <PageHeader title="Configuración" />

      <div className="space-y-4">

        {/* ── Tema ────────────────────────────────────────────── */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Apariencia</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Elige el tema de la aplicación</p>
          </div>
          <div className="px-6 py-5">
            <div className="flex gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const active = themeMode === value
                return (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border text-xs font-medium transition-all',
                      active
                        ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#4a4a48] hover:bg-gray-50 dark:hover:bg-[#252523]',
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Gestión ─────────────────────────────────────────── */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gestión</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Administra tus cuentas y categorías</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#2a2a28]">
            {[
              { to: '/accounts', icon: Wallet, label: 'Cuentas', sub: 'Ver y gestionar tus cuentas' },
              { to: '/categories', icon: Tag, label: 'Categorías', sub: 'Ver y gestionar tus categorías' },
              { to: '/tags', icon: Hash, label: 'Tags', sub: 'Renombrar y eliminar tags de transacciones' },
              { to: '/budgets', icon: PiggyBank, label: 'Presupuestos', sub: 'Límites mensuales por categoría' },
              {
                to: '/recurring',
                icon: RepeatIcon,
                label: 'Recurrentes',
                sub: 'Ver y gestionar transacciones recurrentes',
              },
            ].map(({ to, icon: Icon, label, sub }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252523] flex items-center justify-center">
                    <Icon size={15} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-400 dark:text-gray-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Preferencias ────────────────────────────────────── */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Preferencias</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Ajusta cómo se muestra la información
            </p>
          </div>

          <form
            onSubmit={submitPrefs((data) => prefsMutation.mutate(data))}
            className="px-6 py-5 space-y-5"
          >
            <div>
              <FieldLabel>Moneda</FieldLabel>
              {isLoading ? (
                <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
              ) : (
                <SelectWrapper>
                  <select {...regPrefs('currency')} className={selectCls}>
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </SelectWrapper>
              )}
              <FieldError message={prefsErrors.currency?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Formato de fecha</FieldLabel>
                {isLoading ? (
                  <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
                ) : (
                  <SelectWrapper>
                    <select {...regPrefs('dateFormat')} className={selectCls}>
                      {DATE_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                )}
                <FieldError message={prefsErrors.dateFormat?.message} />
              </div>

              <div>
                <FieldLabel>Idioma</FieldLabel>
                {isLoading ? (
                  <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
                ) : (
                  <SelectWrapper>
                    <select {...regPrefs('language')} className={selectCls}>
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                )}
                <FieldError message={prefsErrors.language?.message} />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={prefsMutation.isPending || isLoading}
                className={saveBtnCls}
              >
                {prefsMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar preferencias'
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
