const PROJ: Record<string, string> = {
  Proposta: "bg-slate-400/15 text-slate-500 ring-slate-400/30",
  Aprovado: "bg-sky-500/15 text-sky-500 ring-sky-500/30",
  "Em execução": "bg-brand/15 text-brand ring-brand/30",
  Concluído: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  Cancelado: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
};

const PAY: Record<string, string> = {
  pago: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  pendente: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  atrasado: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
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
  const cls = map[status] ?? "bg-slate-400/15 text-slate-500 ring-slate-400/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
