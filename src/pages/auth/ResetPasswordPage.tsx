import { authApi } from "@/api/auth";
import { toast } from "@/store/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import AuthRecoveryShell from "./AuthRecoveryShell";

const schema = z
  .object({
    password: z.string().min(10, "Minimo 10 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.resetPassword({ token, password: data.password }),
    onSuccess: () => {
      toast.success("Contrasena actualizada", {
        description: "Ya puedes iniciar sesion con tu nueva contrasena.",
      });
      navigate("/login");
    },
    onError: () => {
      toast.error("No se pudo cambiar la contrasena", {
        description: "El enlace puede haber vencido o ya fue usado.",
      });
    },
  });

  return (
    <AuthRecoveryShell
      title="Nueva contrasena"
      subtitle="Define una contrasena nueva para volver a entrar."
    >
      {!token ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          El enlace no incluye un token valido.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-5"
        >
          <PasswordField
            label="Nueva contrasena"
            error={errors.password?.message}
            inputProps={register("password")}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />
          <PasswordField
            label="Confirmar contrasena"
            error={errors.confirmPassword?.message}
            inputProps={register("confirmPassword")}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Guardar contrasena
          </button>
        </form>
      )}
    </AuthRecoveryShell>
  );
}

function PasswordField({
  label,
  error,
  inputProps,
  show,
  onToggle,
}: {
  label: string;
  error?: string;
  inputProps: UseFormRegisterReturn;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
