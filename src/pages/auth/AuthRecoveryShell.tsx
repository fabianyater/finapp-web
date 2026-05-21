import { ArrowLeft, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthRecoveryShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] px-5 py-8 text-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[1fr_420px]">
          <div className="hidden flex-col justify-between bg-[#0b1a17] p-10 text-white lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-900/40">
                <TrendingUp size={17} />
              </div>
              <span className="text-base font-semibold">Finapp</span>
            </div>
            <div className="max-w-sm">
              <ShieldCheck size={28} className="mb-5 text-emerald-400" />
              <p className="text-3xl font-bold leading-tight">
                Recupera el acceso a tus cuentas.
              </p>
            </div>
            <p className="text-xs text-gray-500">Finapp</p>
          </div>

          <main className="px-6 py-8 sm:px-10 sm:py-12">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft size={13} />
              Volver al login
            </Link>

            <div className="mb-7">
              <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white lg:hidden">
                <TrendingUp size={16} />
              </div>
              <h1 className="mb-1.5 text-2xl font-bold tracking-tight">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-gray-500">
                {subtitle}
              </p>
            </div>

            <div className="mb-7 h-px w-full bg-gray-200" />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
