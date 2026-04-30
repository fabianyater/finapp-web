import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  TrendingUp, Sparkles, Tag, ArrowRight, Loader2,
  Sun, Moon, Monitor, ChevronDown, Check,
} from 'lucide-react'
import { toast } from '@/store/toast'
import { usersApi } from '@/api/users'
import { categoriesApi } from '@/api/categories'
import { useThemeStore, type ThemeMode } from '@/store/theme'
import { cn } from '@/lib/utils'

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

const CATEGORY_TYPE_LABEL: Record<'EXPENSE' | 'INCOME', string> = {
  EXPENSE: 'Gasto',
  INCOME: 'Ingreso',
}

const ICON_MAP: Record<string, string> = {
  'currency-dollar': '💰', 'laptop': '💻', 'utensils': '🍽️', 'car': '🚗',
  'home': '🏠', 'paw': '🐾', 'gamepad': '🎮', 'heart-pulse': '❤️',
  'book': '📚', 'tshirt': '👕', 'plane': '✈️', 'gift': '🎁',
}
function resolveIcon(icon?: string) { return icon ? (ICON_MAP[icon] ?? icon) : '📁' }


// ── Theme mini-preview ─────────────────────────────────────────────────────

function ThemePreview({ value }: { value: ThemeMode }) {
  if (value === 'light') {
    return (
      <div className="w-full h-12 rounded-md overflow-hidden border border-gray-200 flex">
        <div className="w-6 bg-gray-100 flex flex-col gap-1 p-1 pt-1.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-0.5 rounded-full bg-gray-300" />)}
        </div>
        <div className="flex-1 bg-white p-1.5 flex flex-col gap-1 justify-center">
          <div className="h-1 w-3/4 rounded-full bg-gray-200" />
          <div className="h-1 w-1/2 rounded-full bg-gray-100" />
          <div className="h-1 w-2/3 rounded-full bg-emerald-200" />
        </div>
      </div>
    )
  }
  if (value === 'dark') {
    return (
      <div className="w-full h-12 rounded-md overflow-hidden border border-[#3a3a38] flex">
        <div className="w-6 bg-[#252523] flex flex-col gap-1 p-1 pt-1.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-0.5 rounded-full bg-[#4a4a48]" />)}
        </div>
        <div className="flex-1 bg-[#1a1a18] p-1.5 flex flex-col gap-1 justify-center">
          <div className="h-1 w-3/4 rounded-full bg-[#3a3a38]" />
          <div className="h-1 w-1/2 rounded-full bg-[#2a2a28]" />
          <div className="h-1 w-2/3 rounded-full bg-emerald-800/60" />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full h-12 rounded-md overflow-hidden border border-gray-200 flex">
      <div className="w-1/2 flex">
        <div className="w-5 bg-gray-100 flex flex-col gap-1 p-1 pt-1.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-0.5 rounded-full bg-gray-300" />)}
        </div>
        <div className="flex-1 bg-white" />
      </div>
      <div className="w-1/2 flex border-l border-[#3a3a38]">
        <div className="w-5 bg-[#252523] flex flex-col gap-1 p-1 pt-1.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-0.5 rounded-full bg-[#4a4a48]" />)}
        </div>
        <div className="flex-1 bg-[#1a1a18]" />
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function clearFlag() {
  localStorage.removeItem('onboarding_pending')
}

function softBgFromHex(hex: string) {
  const h = hex.startsWith('#') ? hex : `#${hex}`
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.14)`
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setMode: setThemeMode } = useThemeStore()

  const [step, setStep] = useState<'preferences' | 'categories'>('preferences')
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [currency, setCurrency] = useState('MXN')
  const [language, setLanguage] = useState('es')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const isPreferencesStep = step === 'preferences'

  const templatesQuery = useQuery({
    queryKey: ['category-templates'],
    queryFn: categoriesApi.getTemplates,
  })

  const templates = templatesQuery.data ?? []
  const incomeTemplates = templates.filter((t) => t.type === 'INCOME')
  const expenseTemplates = templates.filter((t) => t.type === 'EXPENSE')

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const toggleAll = () => {
    if (selectedKeys.length === templates.length) {
      setSelectedKeys([])
    } else {
      setSelectedKeys(templates.map((t) => t.key))
    }
  }

  const allSelected = templates.length > 0 && selectedKeys.length === templates.length

  const mutation = useMutation({
    mutationFn: async () => {
      await usersApi.updatePreferences({ currency, language, dateFormat, theme })
      await categoriesApi.setup(selectedKeys)
    },
    onSuccess: () => {
      clearFlag()
      navigate('/dashboard')
    },
    onError: () => {
      toast.error('No se pudo completar el onboarding', {
        description: 'Revisa la selección e inténtalo de nuevo. También puedes cambiarlo luego en Configuración.',
      })
    },
  })

  const handleSkip = () => {
    clearFlag()
    navigate('/dashboard')
  }

  const selectCls =
    'w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-9'

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0b1a17] flex-col justify-between p-10">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotgrid-ob" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#10b981" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid-ob)" />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 750 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g-ob" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M0,400 C150,300 300,500 450,380 C600,260 700,420 750,350 L750,800 L0,800 Z" fill="url(#g-ob)" opacity="0.15" />
          <path d="M0,200 Q200,100 400,250 T750,200" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
          <path d="M0,350 Q220,250 420,370 T750,330" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.25" />
          <path d="M0,430 Q200,340 400,440 T750,400" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.35" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <TrendingUp size={17} className="text-white" />
          </div>
          <span className="text-white font-semibold text-base tracking-wide">Finapp</span>
        </div>

        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={13} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Solo toma un momento</p>
              <p className="text-sm font-semibold text-white">
                Configura a tu gusto{' '}
                <span className="text-emerald-400 font-normal text-xs">· Siempre editable</span>
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            {isPreferencesStep ? (
              <>
                Personaliza<br />
                tu experiencia{' '}
                <span className="text-emerald-400">desde el primer día.</span>
              </>
            ) : (
              <>
                Elige las<br />
                <span className="text-emerald-400">categorías de tu cuenta.</span>
              </>
            )}
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">
            {isPreferencesStep
              ? 'Elige cómo quieres ver tu información. Siempre podrás cambiarlo desde Configuración.'
              : 'Selecciona las categorías que quieres tener disponibles para registrar tus movimientos.'}
          </p>

          <div className="space-y-3">
            {[
              {
                icon: Sparkles,
                label: 'Preferencias visuales y regionales',
                active: isPreferencesStep,
              },
              {
                icon: Tag,
                label: 'Selección de categorías para la cuenta',
                active: !isPreferencesStep,
              },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className="flex items-center gap-3 text-gray-400 text-sm">
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                    active
                      ? 'bg-emerald-500/20 border-emerald-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/20',
                  )}
                >
                  <Icon size={11} className="text-emerald-400" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-xs">© 2026 Finapp. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF8] px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mb-6 lg:hidden">
            <TrendingUp size={16} className="text-white" />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
              {isPreferencesStep ? '¡Bienvenido a Finapp!' : 'Último paso'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isPreferencesStep
                ? 'Cuéntanos cómo prefieres trabajar'
                : 'Selecciona las categorías que necesitas'}
            </p>
          </div>

          <div className="w-full h-px bg-gray-200 mb-7" />

          <div className="mb-6 flex items-center gap-2">
            <span
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                isPreferencesStep ? 'bg-emerald-500' : 'bg-emerald-300',
              )}
            />
            <span
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                !isPreferencesStep ? 'bg-emerald-500' : 'bg-gray-200',
              )}
            />
          </div>

          <div className="space-y-6">
            {isPreferencesStep ? (
              <>
                {/* Theme */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Apariencia
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map(({ value, label, icon: Icon }) => {
                      const active = theme === value
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setTheme(value)
                            setThemeMode(value)
                          }}
                          className={cn(
                            'flex flex-col gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all',
                            active
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
                          )}
                        >
                          <ThemePreview value={value} />
                          <div className="flex items-center justify-center gap-1.5">
                            <Icon size={12} strokeWidth={active ? 2.2 : 1.8} />
                            {label}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Moneda
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={selectCls}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Language + Date format */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Idioma
                    </label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setLanguage(l.value)}
                          className={cn(
                            'flex-1 py-2.5 text-xs font-medium transition-colors',
                            language === l.value
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-gray-500 hover:bg-gray-50',
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Fecha
                    </label>
                    <div className="relative">
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className={selectCls}
                      >
                        {DATE_FORMATS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('categories')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                {/* Categories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Categorías
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">
                        {selectedKeys.length} de {templates.length} seleccionadas
                      </span>
                      {templates.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          {allSelected ? 'Limpiar' : 'Todas'}
                        </button>
                      )}
                    </div>
                  </div>

                  {templatesQuery.isLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-xl border border-gray-200 bg-gray-100/70 animate-pulse" />
                      ))}
                    </div>
                  ) : templates.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5">
                      {/* Income group */}
                      {incomeTemplates.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider px-0.5">
                            Ingresos
                          </p>
                          {incomeTemplates.map((template) => {
                            const active = selectedKeys.includes(template.key)
                            const color = template.color
                              ? (template.color.startsWith('#') ? template.color : `#${template.color}`)
                              : '#10b981'
                            return (
                              <button
                                key={template.key}
                                type="button"
                                onClick={() => toggleKey(template.key)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                                  active
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                                )}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                  style={{ backgroundColor: softBgFromHex(color) }}
                                >
                                  {resolveIcon(template.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{template.name}</p>
                                </div>
                                <div className={cn(
                                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                  active
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-gray-300 bg-white',
                                )}>
                                  {active && <Check size={11} strokeWidth={3} className="text-white" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Expense group */}
                      {expenseTemplates.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider px-0.5">
                            Gastos
                          </p>
                          {expenseTemplates.map((template) => {
                            const active = selectedKeys.includes(template.key)
                            const color = template.color
                              ? (template.color.startsWith('#') ? template.color : `#${template.color}`)
                              : '#ef4444'
                            return (
                              <button
                                key={template.key}
                                type="button"
                                onClick={() => toggleKey(template.key)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                                  active
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                                )}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                  style={{ backgroundColor: softBgFromHex(color) }}
                                >
                                  {resolveIcon(template.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{template.name}</p>
                                </div>
                                <div className={cn(
                                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                  active
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-gray-300 bg-white',
                                )}>
                                  {active && <Check size={11} strokeWidth={3} className="text-white" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg p-3 bg-white">
                      No hay categorías disponibles.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('preferences')}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg py-3 text-sm font-semibold transition-colors"
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (templates.length > 0 && selectedKeys.length === 0) {
                        toast.error('Selecciona al menos una categoría')
                        return
                      }
                      mutation.mutate()
                    }}
                    disabled={mutation.isPending || templatesQuery.isLoading || templatesQuery.isError}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Empezar
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
