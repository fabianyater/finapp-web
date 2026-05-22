import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toast } from "@/store/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthRecoveryShell from "./AuthRecoveryShell";

const schema = z.object({
  email: z.string().email("Email invalido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      toast.success("Revisa tu correo", {
        description: "Si el email existe, te enviamos un enlace para recuperar el acceso.",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo enviar el correo"));
    },
  });

  return (
    <AuthRecoveryShell
      title="Recuperar contrasena"
      subtitle="Te enviaremos un enlace para crear una nueva contrasena."
    >
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <MailCheck size={15} />
          )}
          Enviar enlace
          {!mutation.isPending && <ArrowRight size={15} />}
        </button>
      </form>
    </AuthRecoveryShell>
  );
}
