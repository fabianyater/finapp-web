import { accountsApi, type AccountDto } from "@/api/accounts";
import { transactionsApi } from "@/api/transactions";
import { usersApi } from "@/api/users";
import PageHeader from "@/components/PageHeader";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";
import { useThemeStore, type ThemeMode } from "@/store/theme";
import { toast } from "@/store/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Download,
  Hash,
  Loader2,
  Monitor,
  Moon,
  PiggyBank,
  Search,
  Sun,
  Tag,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────────────────────────

const preferencesSchema = z.object({
  currency: z.string(),
  language: z.string(),
  dateFormat: z.string(),
});

type PreferencesForm = z.infer<typeof preferencesSchema>;

// ── Options ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "USD", label: "USD — Dólar estadounidense" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Libra esterlina" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "COP", label: "COP — Peso colombiano" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const THEMES: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

type TransactionExportType = "EXPENSE" | "INCOME" | "TRANSFER";

const TRANSACTION_EXPORT_TYPES: {
  value: TransactionExportType;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "EXPENSE",
    label: "Gastos",
    activeClass:
      "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
  {
    value: "INCOME",
    label: "Ingresos",
    activeClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    value: "TRANSFER",
    label: "Transferencias",
    activeClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0 inline-block" />
      {message}
    </p>
  );
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
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

function startOfDayIso(date: string) {
  return date ? new Date(`${date}T00:00:00`).toISOString() : undefined;
}

function endOfDayIso(date: string) {
  return date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined;
}

function TransactionExportSection({
  accounts,
  accountsLoading,
  saveBtnCls,
}: {
  accounts: AccountDto[];
  accountsLoading: boolean;
  saveBtnCls: string;
}) {
  const [accountScope, setAccountScope] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TransactionExportType[]>(
    TRANSACTION_EXPORT_TYPES.map(({ value }) => value),
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  function toggleAccount(accountId: string) {
    setSelectedAccountIds((ids) =>
      ids.includes(accountId)
        ? ids.filter((id) => id !== accountId)
        : [...ids, accountId],
    );
  }

  function toggleType(type: TransactionExportType) {
    setSelectedTypes((types) =>
      types.includes(type)
        ? types.filter((value) => value !== type)
        : [...types, type],
    );
  }

  async function handleExport() {
    if (
      isExporting ||
      selectedTypes.length === 0 ||
      (accountScope === "SELECTED" && selectedAccountIds.length === 0)
    ) {
      return;
    }

    setIsExporting(true);
    try {
      const blob = await transactionsApi.exportCsv({
        accountIds:
          accountScope === "SELECTED" ? selectedAccountIds : undefined,
        types:
          selectedTypes.length === TRANSACTION_EXPORT_TYPES.length
            ? undefined
            : selectedTypes,
        dateFrom: startOfDayIso(dateFrom),
        dateTo: endOfDayIso(dateTo),
        search: search.trim() || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo exportar el CSV"));
    } finally {
      setIsExporting(false);
    }
  }

  const exportDisabled =
    isExporting ||
    accountsLoading ||
    accounts.length === 0 ||
    selectedTypes.length === 0 ||
    (accountScope === "SELECTED" && selectedAccountIds.length === 0);

  return (
    <section className="border-t border-gray-100 px-1 py-6 dark:border-[#2a2a28]">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Datos
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Exporta transacciones con filtros antes de descargar el CSV
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <FieldLabel>Cuentas</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "ALL" as const, label: "Todas las cuentas" },
              { value: "SELECTED" as const, label: "Elegir cuentas" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccountScope(value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors",
                  accountScope === value
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-[#3a3a38] dark:text-gray-400 dark:hover:bg-[#252523]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {accountScope === "SELECTED" && (
            <div className="mt-2 rounded-lg border border-gray-200 dark:border-[#3a3a38] divide-y divide-gray-100 dark:divide-[#2a2a28] overflow-hidden">
              {accountsLoading ? (
                <div className="h-12 bg-gray-100 animate-pulse dark:bg-[#252523]" />
              ) : accounts.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500">
                  No hay cuentas para exportar.
                </p>
              ) : (
                accounts.map((account) => (
                  <label
                    key={account.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-[#252523]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {account.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {account.currency}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Tipos de transaccion</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {TRANSACTION_EXPORT_TYPES.map(({ value, label, activeClass }) => {
              const active = selectedTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleType(value)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? activeClass
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#252523]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {selectedTypes.length === 0 && (
            <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
              Selecciona al menos un tipo de transaccion.
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-[#3a3a38] dark:bg-[#252523]">
            <CalendarRange
              size={14}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            />
            <span className="sr-only">Desde</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-[#3a3a38] dark:bg-[#252523]">
            <CalendarRange
              size={14}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            />
            <span className="sr-only">Hasta</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
            />
          </label>
        </div>

        <label className="relative block">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <span className="sr-only">Buscar transacciones</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por texto antes de exportar"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-emerald-500 dark:border-[#3a3a38] dark:bg-[#252523] dark:text-gray-100 dark:placeholder:text-gray-600"
          />
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportDisabled}
            className={saveBtnCls}
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { mode: themeMode, setMode: setTheme } = useThemeStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: usersApi.getMe,
  });
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });

  // ── Preferences form ──────────────────────────────────────────────────

  const {
    register: regPrefs,
    handleSubmit: submitPrefs,
    reset: resetPrefs,
    formState: { errors: prefsErrors },
  } = useForm<PreferencesForm>({ resolver: zodResolver(preferencesSchema) });

  useEffect(() => {
    if (profile?.preferences) resetPrefs(profile.preferences);
  }, [profile, resetPrefs]);

  const prefsMutation = useMutation({
    mutationFn: usersApi.updatePreferences,
    onSuccess: (updated) => {
      queryClient.setQueryData(["user", "me"], updated);
      toast.success("Preferencias guardadas");
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "No se pudieron guardar las preferencias"),
      );
    },
  });

  const themeMutation = useMutation({
    mutationFn: (theme: ThemeMode) => usersApi.updatePreferences({ theme }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["user", "me"], updated);
    },
  });

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    themeMutation.mutate(mode);
  };

  // ── Shared styles ─────────────────────────────────────────────────────

  const selectCls =
    "w-full appearance-none bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-9";

  const saveBtnCls =
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader title="Configuración" back={false} />

      <div className="rounded-2xl border border-gray-100 bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.04)] dark:border-[#2a2a28] dark:bg-[#1a1a18] dark:shadow-none sm:px-6">
        {/* ── Tema ────────────────────────────────────────────── */}
          <section className="py-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Apariencia
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Elige el tema de la aplicación
              </p>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-50 p-1 dark:bg-[#151513]">
                {THEMES.map(({ value, label, icon: Icon }) => {
                  const active = themeMode === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleThemeChange(value)}
                      className={cn(
                        "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-all",
                        active
                          ? "bg-white text-emerald-700 shadow-sm dark:bg-[#252523] dark:text-emerald-400"
                          : "text-gray-500 hover:bg-white/80 dark:text-gray-400 dark:hover:bg-[#252523]",
                      )}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Gestión ─────────────────────────────────────────── */}
          <section className="border-t border-gray-100 py-6 dark:border-[#2a2a28]">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Gestión
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Administra tus cuentas y categorías
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#2a2a28]">
              {[
                {
                  to: "/accounts",
                  icon: Wallet,
                  label: "Cuentas",
                  sub: "Ver y gestionar tus cuentas",
                },
                {
                  to: "/categories",
                  icon: Tag,
                  label: "Categorías",
                  sub: "Ver y gestionar tus categorías",
                },
                {
                  to: "/tags",
                  icon: Hash,
                  label: "Tags",
                  sub: "Renombrar y eliminar tags de transacciones",
                },
                {
                  to: "/budgets",
                  icon: PiggyBank,
                  label: "Presupuestos",
                  sub: "Límites mensuales por categoría",
                },
              ].map(({ to, icon: Icon, label, sub }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between rounded-xl px-1 py-3 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252523] flex items-center justify-center">
                      <Icon
                        size={15}
                        className="text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {sub}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* ── Preferencias ────────────────────────────────────── */}
          <TransactionExportSection
            accounts={accountsData?.data ?? []}
            accountsLoading={accountsLoading}
            saveBtnCls={saveBtnCls}
          />

          <section className="border-t border-gray-100 py-6 dark:border-[#2a2a28]">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Preferencias
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Ajusta cómo se muestra la información
              </p>
            </div>

            <form
              onSubmit={submitPrefs((data) => prefsMutation.mutate(data))}
              className="space-y-5"
            >
              <div>
                <FieldLabel>Moneda</FieldLabel>
                {isLoading ? (
                  <div className="h-11 bg-gray-100 dark:bg-[#252523] rounded-lg animate-pulse" />
                ) : (
                  <SelectWrapper>
                    <select {...regPrefs("currency")} className={selectCls}>
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
                      <select {...regPrefs("dateFormat")} className={selectCls}>
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
                      <select {...regPrefs("language")} className={selectCls}>
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
                    "Guardar preferencias"
                  )}
                </button>
              </div>
            </form>
          </section>
      </div>
    </div>
  );
}
