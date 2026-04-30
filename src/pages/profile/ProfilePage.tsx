import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/store/toast'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/store/auth'
import { Loader2, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  surname: z.string().min(1, 'El apellido es requerido'),
})

type ProfileForm = z.infer<typeof profileSchema>

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

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: usersApi.getMe,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (profile) reset({ name: profile.name, surname: profile.surname })
  }, [profile, reset])

  const profileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'me'], updated)
      toast.success('Perfil actualizado')
    },
    onError: () => toast.error('No se pudo guardar el perfil'),
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: () => {
      logout()
      navigate('/login')
    },
    onError: () => toast.error('No se pudo eliminar la cuenta'),
  })

  const inputCls =
    'w-full bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors'

  const cardCls =
    'bg-white dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-xl overflow-hidden'

  const cardHeaderCls =
    'px-6 py-5 border-b border-gray-100 dark:border-[#2a2a28]'

  const saveBtnCls =
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2'

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-20">
      <PageHeader title="Perfil" />

      <div className="space-y-4">

        {/* ── Datos personales ────────────────────────────── */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Información personal</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tu nombre y datos de contacto</p>
          </div>

          <form
            onSubmit={handleSubmit((data) => profileMutation.mutate(data))}
            className="px-6 py-5 space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Nombre</FieldLabel>
                {isLoading ? (
                  <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
                ) : (
                  <input {...register('name')} placeholder="Juan" className={inputCls} />
                )}
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <FieldLabel>Apellido</FieldLabel>
                {isLoading ? (
                  <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
                ) : (
                  <input {...register('surname')} placeholder="Pérez" className={inputCls} />
                )}
                <FieldError message={errors.surname?.message} />
              </div>
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              {isLoading ? (
                <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
              ) : (
                <input
                  type="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className="w-full bg-gray-50 dark:bg-[#1a1a18] border border-gray-200 dark:border-[#2a2a28] rounded-lg px-4 py-3 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                />
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                El email no puede modificarse
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={profileMutation.isPending || isLoading}
                className={saveBtnCls}
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Cerrar sesión ─────────────────────────────── */}
        <div className={cardCls}>
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cerrar sesión</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Salir de tu cuenta en este dispositivo
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── Eliminar cuenta ───────────────────────────── */}
        <div className="bg-white dark:bg-[#1a1a18] border border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden">
          <div className="px-6 py-5">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Eliminar cuenta</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Elimina permanentemente tu cuenta y todos tus datos
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 dark:border-rose-800 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 size={15} />
                  Eliminar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">¿Estás seguro?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Esta acción es irreversible. Se eliminarán tu cuenta, cuentas bancarias, transacciones y todos tus datos.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Confirmar eliminación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
