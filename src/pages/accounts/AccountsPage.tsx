import { accountsApi, type AccountDto, type MemberDto } from "@/api/accounts";
import { MoneyInput } from "@/components/MoneyInput";
import PageHeader from "@/components/PageHeader";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { isDemoAccount } from "@/lib/demoAccount";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { EmojiStyle, Theme } from "emoji-picker-react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

// ── constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Efectivo", emoji: "💵" },
  { value: "BANK", label: "Banco", emoji: "🏦" },
  { value: "CREDIT_CARD", label: "Crédito", emoji: "💳" },
];

const ACCOUNT_TYPE_LABELS = Object.fromEntries(
  ACCOUNT_TYPES.map(({ value, label }) => [value, label]),
) as Record<AccountDto["type"], string>;

const CURRENCIES = ["COP", "MXN", "USD", "EUR", "ARS", "GBP"];

const ICON_TO_KEY: Record<string, string> = {
  "💰": "currency-dollar",
  "💳": "credit-card",
  "🏦": "bank",
  "💵": "cash",
  "🪙": "coin",
  "💼": "briefcase",
  "🛍️": "shopping",
  "✈️": "plane",
  "🏠": "home",
  "🚗": "car",
  "🍽️": "utensils",
  "📱": "phone",
};

const KEY_TO_ICON: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_TO_KEY).map(([e, k]) => [k, e]),
);

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#000000",
];

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function resolveIcon(key?: string) {
  if (!key) return "💰";
  return KEY_TO_ICON[key] ?? key;
}

// ── form schema ───────────────────────────────────────────────────────────────

function colorGlow(hex: string) {
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `0 10px 24px rgba(${r},${g},${b},0.22), 0 2px 8px rgba(${r},${g},${b},0.14)`;
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(80),
  type: z.enum(["CASH", "BANK", "CREDIT_CARD"]),
  initialBalance: z.number({ message: "Ingresa un monto" }),
  currency: z.string().min(1),
  icon: z.string(),
  color: z.string(),
  isDefault: z.boolean(),
  excludeFromTotal: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const EmojiPicker = lazy(() => import("emoji-picker-react"));

// ── account form sheet ────────────────────────────────────────────────────────

function AccountSheet({
  account,
  onClose,
}: {
  account: AccountDto | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? "",
      type: (account?.type as FormData["type"]) ?? "CASH",
      initialBalance: account ? account.initialBalance : 0,
      currency: account?.currency ?? "COP",
      icon: account?.icon ? resolveIcon(account.icon) : "💰",
      color: account?.color
        ? account.color.startsWith("#")
          ? account.color
          : `#${account.color}`
        : "#3b82f6",
      isDefault: account?.isDefault ?? false,
      excludeFromTotal: account?.excludeFromTotal ?? false,
    },
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const selectedColor = useWatch({ control, name: "color" });
  const selectedIcon = useWatch({ control, name: "icon" });
  const selectedName = useWatch({ control, name: "name" });
  const selectedCurrency = useWatch({ control, name: "currency" });

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Cuenta creada");
      onClose();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo crear la cuenta")),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      accountsApi.update(account!.id, {
        name: data.name,
        type: data.type,
        initialBalance: Math.round(data.initialBalance),
        icon: ICON_TO_KEY[data.icon] ?? data.icon,
        color: data.color,
        defaultAccount: data.isDefault,
        excludeFromTotal: data.excludeFromTotal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Cuenta actualizada");
      onClose();
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo actualizar la cuenta")),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        name: data.name,
        type: data.type,
        initialBalance: Math.round(data.initialBalance),
        icon: ICON_TO_KEY[data.icon] ?? data.icon,
        color: data.color,
        currency: data.currency,
      });
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-[#3a3a38] dark:bg-[#252523] dark:text-gray-100 dark:focus:ring-emerald-950";
  const labelCls = "mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-gray-100 bg-white dark:border-[#2a2a28] dark:bg-[#1a1a18] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white/95 px-5 pb-4 pt-5 backdrop-blur dark:border-[#2a2a28] dark:bg-[#1a1a18]/95">
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-gray-100">
              {isEdit ? "Editar cuenta" : "Nueva cuenta"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {isEdit
                ? "Actualiza los detalles y apariencia."
                : "Nombre, tipo y saldo para empezar."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 px-5 pb-8 pt-5"
        >
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-[#2a2a28] dark:bg-[#151513]">
            <label className={labelCls}>Tipo</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-[#252523]">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => field.onChange(t.value)}
                      className={cn(
                        "h-9 rounded-lg text-xs font-semibold transition-colors",
                        field.value === t.value
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#30302d]",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-[#2a2a28] dark:bg-[#151513]">
            <label className={labelCls}>Nombre</label>
            <div className="flex items-center gap-3">
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((open) => !open)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-2xl shadow-sm transition-colors hover:border-emerald-300 dark:border-[#3a3a38] dark:bg-[#252523]"
                    title="Elegir emoji"
                  >
                    {field.value}
                  </button>
                )}
              />
              <div className="min-w-0 flex-1">
                <input
                  {...register("name")}
                  placeholder="Billetera, banco, tarjeta..."
                  className={inputCls}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* balance + currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Saldo inicial</label>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    value={field.value === 0 ? "" : field.value}
                    onChange={(v) => field.onChange(v === "" ? 0 : v)}
                    currency={selectedCurrency}
                    className={inputCls}
                  />
                )}
              />
              {errors.initialBalance && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.initialBalance.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      className={cn(inputCls, "appearance-none pr-8")}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
            </div>
          </div>

          {showEmojiPicker && (
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-[#3a3a38]">
                  <Suspense
                    fallback={
                      <div className="flex h-80 items-center justify-center bg-gray-50 text-xs text-gray-400 dark:bg-[#252523] dark:text-gray-500">
                        Cargando emojis...
                      </div>
                    }
                  >
                    <EmojiPicker
                      width="100%"
                      height={320}
                      theme={"auto" as Theme}
                      emojiStyle={"native" as EmojiStyle}
                      lazyLoadEmojis
                      searchPlaceholder="Buscar emoji"
                      previewConfig={{ showPreview: false }}
                      onEmojiClick={(emoji) => {
                        field.onChange(emoji.emoji);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </Suspense>
                </div>
              )}
            />
          )}

          <div className="rounded-2xl border border-gray-100 p-3 dark:border-[#2a2a28]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${selectedColor}22` }}
              >
                {selectedIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedName || "Mi cuenta"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Color de la cuenta
                </p>
              </div>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex max-w-44 flex-wrap justify-end gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field.onChange(c)}
                        aria-label={`Color ${c}`}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition-transform",
                          field.value === c
                            ? "scale-110 border-gray-900 dark:border-white"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-3 rounded-2xl border border-gray-100 p-3 dark:border-[#2a2a28]">
              <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Cuenta predeterminada
                  </span>
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      field.value
                        ? "bg-emerald-500"
                        : "bg-gray-200 dark:bg-[#3a3a38]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        field.value ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </label>
              )}
              />
              <Controller
              name="excludeFromTotal"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Excluir del total
                  </span>
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      field.value
                        ? "bg-emerald-500"
                        : "bg-gray-200 dark:bg-[#3a3a38]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        field.value ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </label>
              )}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>
      </div>
    </>
  );
}

// ── members sheet ─────────────────────────────────────────────────────────────

function MembersSheet({
  account,
  onClose,
  isDemo,
}: {
  account: AccountDto;
  onClose: () => void;
  isDemo: boolean;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["account-members", account.id],
    queryFn: () => accountsApi.listMembers(account.id),
  });

  const inviteMutation = useMutation({
    mutationFn: (e: string) => accountsApi.inviteMember(account.id, e),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account-members", account.id],
      });
      setEmail("");
      toast.success("Invitación enviada");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo invitar al usuario")),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      accountsApi.removeMember(account.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account-members", account.id],
      });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Miembro eliminado");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo eliminar el miembro")),
  });

  function initials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#1a1a18] rounded-t-2xl border-t border-gray-100 dark:border-[#2a2a28] max-h-[80vh] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-[#1a1a18] px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#2a2a28] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Miembros
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {account.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252523] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 pb-10">
          {/* invite */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Invitar por correo
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && email && !isDemo && inviteMutation.mutate(email)
                }
                disabled={isDemo}
                placeholder="correo@ejemplo.com"
                className="flex-1 bg-white dark:bg-[#252523] border border-gray-200 dark:border-[#3a3a38] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                onClick={() => email && inviteMutation.mutate(email)}
                disabled={!email || inviteMutation.isPending || isDemo}
                className="px-3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                {inviteMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Invitar
              </button>
            </div>
            {isDemo && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                Las invitaciones estan deshabilitadas para el usuario demo.
              </p>
            )}
          </div>

          {/* list */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Miembros con acceso · {members.length}
            </label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 dark:bg-[#252523] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-3">
                Sin miembros aún. Invita a alguien arriba.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3",
                      m.owner
                        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/70 dark:bg-emerald-950/15"
                        : "border-transparent bg-gray-50 dark:bg-[#252523]",
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        <span className="truncate">{m.name}</span>
                        {m.owner && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Propietario
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {m.email}
                      </p>
                    </div>
                    {!m.owner && !isDemo && (
                      <button
                        onClick={() => removeMutation.mutate(m.userId)}
                        disabled={removeMutation.isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors disabled:opacity-40"
                        title="Quitar miembro"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── account card ──────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onEdit,
  onArchive,
  onDelete,
  onMembers,
  isDemo,
}: {
  account: AccountDto;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMembers: () => void;
  isDemo: boolean;
}) {
  const color = account.color
    ? account.color.startsWith("#")
      ? account.color
      : `#${account.color}`
    : "#9ca3af";

  return (
    <div
      className={cn(
        "relative flex min-h-[13rem] flex-col overflow-hidden rounded-3xl border bg-white p-4 dark:bg-[#1a1a18]",
        account.isArchived
          ? "border-gray-100 opacity-60 dark:border-[#2a2a28]"
          : "border-white/80 shadow-[0_18px_42px_rgba(32,28,24,0.1),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-[#2a2a28] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)]",
      )}
    >
      {account.isDefault && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/25 dark:text-amber-300">
          Principal
        </span>
      )}

      <div className="flex items-start gap-3 pr-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
          style={{
            backgroundColor: `${color}18`,
            boxShadow: colorGlow(color),
            color,
          }}
        >
          {resolveIcon(account.icon)}
        </div>

        <div className={cn("min-w-0 flex-1", account.isDefault && "pr-16")}>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {account.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}
            {account.isArchived ? " · Archivada" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xl font-semibold leading-none tabular-nums text-gray-950 dark:text-white">
          {fmt(account.currentBalance, account.currency)}
        </p>
        <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
          Balance
        </p>
        <AccountAccessSummary members={account.members ?? []} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 pt-2 dark:border-[#2a2a28]">
        <div className="flex min-w-0 flex-wrap gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
          <span
            className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-50 px-1.5 dark:bg-[#252523]"
            title={`${account.transactionCount ?? 0} transaccion${account.transactionCount === 1 ? "" : "es"}`}
            aria-label={`${account.transactionCount ?? 0} transaccion${account.transactionCount === 1 ? "" : "es"}`}
          >
            <ReceiptText size={11} />
            <span className="tabular-nums">
              {account.transactionCount ?? 0}
            </span>
          </span>
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 dark:bg-[#252523]"
            title={account.excludeFromTotal ? "Excluida del total" : "Incluida en el total"}
            aria-label={
              account.excludeFromTotal
                ? "Excluida del total"
                : "Incluida en el total"
            }
          >
            {account.excludeFromTotal ? (
              <EyeOff size={11} />
            ) : (
              <Eye size={11} />
            )}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onMembers}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            title="Miembros"
            aria-label={`Miembros de ${account.name}`}
          >
            <Users size={13} />
          </button>
          <button
            onClick={onEdit}
            disabled={isDemo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            title="Editar"
            aria-label={`Editar ${account.name}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onArchive}
            disabled={isDemo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-[#252523] dark:hover:text-gray-200"
            title={account.isArchived ? "Desarchivar" : "Archivar"}
            aria-label={`${account.isArchived ? "Desarchivar" : "Archivar"} ${account.name}`}
          >
            {account.isArchived ? (
              <ArchiveRestore size={13} />
            ) : (
              <Archive size={13} />
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={isDemo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-rose-950/20"
            title="Eliminar"
            aria-label={`Eliminar ${account.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

function AccountAccessSummary({ members }: { members?: MemberDto[] }) {
  const sharedMembers = members?.filter((member) => !member.owner);

  if (!members) {
    return (
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        Consultando acceso...
      </p>
    );
  }

  if (sharedMembers?.length === 0) {
    return (
      <p className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        Privada
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-medium text-gray-600 dark:text-gray-300">
      {members.map((member) => (
        <span
          key={member.userId}
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-1",
            member.owner
              ? "border-emerald-300 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-200"
              : "border-transparent bg-gray-50 dark:bg-[#252523]",
          )}
          title={member.email}
        >
          <span className="max-w-24 truncate">{member.name}</span>
          {member.owner && (
            <span className="rounded-full bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              Propietario
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const isDemo = isDemoAccount(authUser?.email);
  const [sheet, setSheet] = useState<"create" | AccountDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountDto | null>(null);
  const [membersTarget, setMembersTarget] = useState<AccountDto | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | AccountDto["type"]>(
    "ALL",
  );
  const [sortBy, setSortBy] = useState<"NAME" | "BALANCE">("NAME");

  const { data, isLoading } = useQuery({
    queryKey: ["accounts", "summary"],
    queryFn: accountsApi.listWithSummary,
  });

  const accounts = data?.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const visibleAccounts = [...accounts]
    .filter((account) => {
      const matchesType = typeFilter === "ALL" || account.type === typeFilter;
      const matchesSearch =
        !normalizedSearch ||
        [account.name, account.currency, ACCOUNT_TYPE_LABELS[account.type]]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesType && matchesSearch;
    })
    .sort((a, b) =>
      sortBy === "BALANCE"
        ? b.currentBalance - a.currentBalance
        : a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  const active = visibleAccounts.filter((a) => !a.isArchived);
  const archived = visibleAccounts.filter((a) => a.isArchived);
  const archiveMutation = useMutation({
    mutationFn: ({
      id,
      isArchived,
      excludeFromTotal,
    }: {
      id: string;
      isArchived: boolean;
      excludeFromTotal: boolean;
    }) =>
      isArchived
        ? accountsApi.unarchive(id)
        : accountsApi.archive(id, excludeFromTotal),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(
        vars.isArchived ? "Cuenta desarchivada" : "Cuenta archivada",
      );
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo actualizar la cuenta")),
  });

  const deleteMutation = useMutation({
    mutationFn: accountsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDeleteTarget(null);
      toast.success("Cuenta eliminada");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo eliminar la cuenta")),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageHeader title="Cuentas" className="flex items-center gap-2" />
          <p className="ml-10 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Gestiona tus cuentas y el saldo disponible.
          </p>
        </div>
        <button
          onClick={() => setSheet("create")}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus size={14} />
          Nueva cuenta
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 dark:bg-[#252523] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No tienes cuentas aún
          </p>
          <button
            onClick={() => setSheet("create")}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] dark:border-[#2a2a28] dark:bg-[#1a1a18] sm:grid-cols-[minmax(0,1fr)_9rem_10rem]">
            <label className="relative block min-w-0">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cuenta..."
                className="h-10 w-full rounded-xl border border-transparent bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white dark:bg-[#121211] dark:text-gray-100"
              />
            </label>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "ALL" | AccountDto["type"])
              }
              className="h-10 w-full rounded-xl border border-transparent bg-gray-50 px-3 text-xs text-gray-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:bg-[#121211] dark:text-gray-200"
            >
              <option value="ALL">Todos los tipos</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "NAME" | "BALANCE")
              }
              className="h-10 w-full rounded-xl border border-transparent bg-gray-50 px-3 text-xs text-gray-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:bg-[#121211] dark:text-gray-200"
            >
              <option value="NAME">Nombre de la cuenta</option>
              <option value="BALANCE">Mayor saldo</option>
            </select>
          </div>

          {visibleAccounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-[#323230] dark:text-gray-500">
              No hay cuentas con esos filtros
            </div>
          )}

          {active.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Activas · {active.length}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {active.map((a) => (
                  <AccountCard
                    key={a.id}
                    account={a}
                    isDemo={isDemo}
                    onEdit={() => setSheet(a)}
                    onArchive={() =>
                      archiveMutation.mutate({
                        id: a.id,
                        isArchived: a.isArchived,
                        excludeFromTotal: a.excludeFromTotal,
                      })
                    }
                    onDelete={() => setDeleteTarget(a)}
                    onMembers={() => setMembersTarget(a)}
                  />
                ))}
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Archivadas · {archived.length}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {archived.map((a) => (
                  <AccountCard
                    key={a.id}
                    account={a}
                    isDemo={isDemo}
                    onEdit={() => setSheet(a)}
                    onArchive={() =>
                      archiveMutation.mutate({
                        id: a.id,
                        isArchived: a.isArchived,
                        excludeFromTotal: a.excludeFromTotal,
                      })
                    }
                    onDelete={() => setDeleteTarget(a)}
                    onMembers={() => setMembersTarget(a)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* account sheet */}
      {sheet !== null && (
        <AccountSheet
          account={sheet === "create" ? null : sheet}
          onClose={() => setSheet(null)}
        />
      )}

      {/* members sheet */}
      {membersTarget && (
        <MembersSheet
          account={membersTarget}
          onClose={() => setMembersTarget(null)}
          isDemo={isDemo}
        />
      )}

      {/* delete confirm */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="fixed inset-x-4 bottom-8 z-50 bg-white dark:bg-[#1a1a18] rounded-2xl border border-gray-100 dark:border-[#2a2a28] p-5 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              ¿Eliminar cuenta?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Se eliminará{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                "{deleteTarget.name}"
              </span>{" "}
              y todas sus transacciones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a38] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252523] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
