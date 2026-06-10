const PROJ: Record<string, string> = {
  Proposta: "bg-slate-100 text-slate-600 ring-slate-200",
  Aprovado: "bg-sky-50 text-sky-700 ring-sky-200",
  "Em execução": "bg-brand-soft text-brand-dark ring-brand/30",
  Concluído: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-600 ring-rose-200",
};

const PAY: Record<string, string> = {
  pago: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pendente: "bg-amber-50 text-amber-700 ring-amber-200",
  atrasado: "bg-rose-50 text-rose-700 ring-rose-200",
};

const PAY_LABEL: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Em atraso",
};

export function StatusBadge({
  status,
  kind = "projeto",
}: {
  status: string;
  kind?: "projeto" | "pagamento";
}) {
  const map = kind === "projeto" ? PROJ : PAY;
  const label = kind === "pagamento" ? PAY_LABEL[status] ?? status : status;
  const cls = map[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
