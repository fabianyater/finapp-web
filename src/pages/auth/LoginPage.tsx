import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, TrendingUp, Sparkles, Tag, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from '@/store/toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, { userId: data.userId, email: data.email })
      const destination = localStorage.getItem('onboarding_pending') ? '/onboarding' : '/dashboard'
      navigate(destination)
    },
    onError: () => {
      toast.error('Credenciales inválidas', { description: 'Revisa tu email y contraseña.' })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0b1a17] flex-col justify-between p-10">
        {/* Dot grid — ledger paper texture */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#10b981" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* Wave SVG background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 750 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M0,400 C150,300 300,500 450,380 C600,260 700,420 750,350 L750,800 L0,800 Z" fill="url(#g1)" opacity="0.15" />
          <path d="M0,500 C100,420 250,550 400,460 C550,370 680,480 750,420 L750,800 L0,800 Z" fill="#10b981" opacity="0.08" />
          <path d="M0,200 Q200,100 400,250 T750,200" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
          <path d="M0,280 Q180,180 380,310 T750,270" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.3" />
          <path d="M0,350 Q220,250 420,370 T750,330" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.25" />
          <path d="M0,430 Q200,340 400,440 T750,400" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.35" />
          <path d="M0,500 Q180,420 380,510 T750,470" fill="none" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.2" />
        </svg>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <TrendingUp size={17} className="text-white" />
          </div>
          <span className="text-white font-semibold text-base tracking-wide">Finapp</span>
        </div>

        {/* Hero section */}
        <div className="relative z-10">
          {/* Floating balance card */}
          <div className="mb-8 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance del mes</p>
              <p className="text-sm font-semibold text-white">
                +$12,450.00{' '}
                <span className="text-emerald-400 font-normal text-xs">↑ 8.3%</span>
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Gestión inteligente<br />
            de tu dinero,{' '}
            <span className="text-emerald-400">donde quieras.</span>
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">
            Registra ingresos y gastos, organiza tus cuentas y toma el control total de tus finanzas.
          </p>

          <div className="space-y-3">
            {[
              { icon: Sparkles, label: 'Resumen inteligente de tus gastos' },
              { icon: TrendingUp, label: 'Seguimiento de ingresos en tiempo real' },
              { icon: Tag, label: 'Categorías y etiquetas personalizadas' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={11} className="text-emerald-400" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-gray-600 text-xs">© 2026 Finapp. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right panel — warm off-white, not stark white */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF8] px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mb-6 lg:hidden">
            <TrendingUp size={16} className="text-white" />
          </div>

          {/* Welcome header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-500 text-sm">Inicia sesión para gestionar tus finanzas</p>
          </div>

          {/* Ledger ruling line — the signature element */}
          <div className="w-full h-px bg-gray-200 mb-7" />

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              {errors.email && (
                <p className="text-red-500 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0 inline-block" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0 inline-block" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Register + trust signal */}
          <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Regístrate
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Lock size={11} />
              <span className="text-xs">Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
