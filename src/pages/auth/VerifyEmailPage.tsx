import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toast } from "@/store/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import AuthRecoveryShell from "./AuthRecoveryShell";

const schema = z.object({
  email: z.string().email("Email invalido"),
});

type FormData = z.infer<typeof schema>;

export default function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const verificationStarted = useRef(false);
  const email = searchParams.get("email") ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email },
  });

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
  });
  const requestMutation = useMutation({
    mutationFn: authApi.requestEmailVerification,
    onSuccess: () => {
      toast.success("Revisa tu correo", {
        description: "Si la cuenta necesita validacion, te enviamos un enlace.",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo enviar el correo"));
    },
  });

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    verifyMutation.mutate({ token });
    if (searchParams.has("token")) {
      setSearchParams({}, { replace: true });
    }
  }, [token, searchParams, setSearchParams, verifyMutation]);

  return (
    <AuthRecoveryShell
      title="Verificar correo"
      subtitle="Activa tu cuenta para poder iniciar sesion."
    >
      {token ? (
        <VerificationResult
          pending={verifyMutation.isPending}
          success={verifyMutation.isSuccess}
        />
      ) : (
        <form
          onSubmit={handleSubmit((data) => requestMutation.mutate(data))}
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
            disabled={requestMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {requestMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <MailCheck size={15} />
            )}
            Enviar enlace
            {!requestMutation.isPending && <ArrowRight size={15} />}
          </button>
        </form>
      )}
    </AuthRecoveryShell>
  );
}

function VerificationResult({
  pending,
  success,
}: {
  pending: boolean;
  success: boolean;
}) {
  if (pending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
        <Loader2 size={16} className="animate-spin text-emerald-600" />
        Validando tu enlace...
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <ShieldCheck size={16} />
            Correo verificado
          </div>
          Ya puedes iniciar sesion.
        </div>
        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Ir al login
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
        El enlace no es valido o ya vencio.
      </div>
      <Link
        to="/verify-email"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        Pedir otro enlace
      </Link>
    </div>
  );
}
