"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cliente, Projeto, PessoaCliente, STATUS_PROJETO, pagamentoStatus, rtValor, artValor } from "@/lib/types";
import { brl } from "@/lib/format";
import { PastaObra } from "@/components/PastaObra";

function projetosDoCliente(c: Cliente, projetos: Projeto[]) {
  const nome = c.nome.trim().toLowerCase();
  return projetos.filter(
    (p) =>
      p.cliente_id === c.id ||
      (!p.cliente_id && (p.cliente ?? "").trim().toLowerCase() === nome)
  );
}

function statsObra(o: Projeto) {
  let recebido = 0;
  let aReceber = 0;
  for (const pg of o.pagamentos) {
    const st = pagamentoStatus(pg);
    if (st === "pago") recebido += Number(pg.valor);
    else aReceber += Number(pg.valor);
  }
  const contratado = o.status !== "Cancelado" ? Number(o.valor_total) : 0;
  const temRt = o.tem_rt;
  const temArt = o.tem_art;
  const rt = temRt && !o.rt_pago ? rtValor(o) : 0;
  const art = temArt && !o.art_pago ? artValor(o) : 0;
  return { contratado, recebido, aReceber, temRt, temArt, rt, art };
}

const STATUS_COR: Record<string, string> = {
  Proposta: "bg-slate-400 text-white",
  Aprovado: "bg-sky-500 text-white",
  "Em execução (projeto preliminar)": "bg-brand text-white",
  "Em revisão": "bg-amber-500 text-white",
  "Concluído (projeto executivo)": "bg-emerald-500 text-white",
  Cancelado: "bg-rose-500 text-white",
};

type Periodo = "dia" | "semana" | "mes" | "3m" | "6m" | "1a" | "todos";

const PERIODOS: { key: Periodo; label: string; dias: number | null }[] = [
  { key: "dia", label: "Hoje", dias: 1 },
  { key: "semana", label: "Semana", dias: 7 },
  { key: "mes", label: "Mês", dias: 30 },
  { key: "3m", label: "3 meses", dias: 90 },
  { key: "6m", label: "6 meses", dias: 180 },
  { key: "1a", label: "1 ano", dias: 365 },
  { key: "todos", label: "Todos", dias: null },
];

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClientesView({
  clientes,
  projetos,
  pessoasCliente,
  onNew,
  onNovaObra,
  onEdit,
  onDelete,
  onAtualizarObra,
  obraParaAbrir,
  onObraAberta,
}: {
  clientes: Cliente[];
  projetos: Projeto[];
  pessoasCliente: PessoaCliente[];
  onNew: () => void;
  onNovaObra: () => void;
  onEdit: (c: Cliente) => void;
  onDelete: (c: Cliente) => void;
  onAtualizarObra: (id: string, campos: Record<string, unknown>) => Promise<string | null>;
  obraParaAbrir?: string | null;
  onObraAberta?: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [obraAbertaId, setObraAbertaId] = useState<string | null>(null);
  const obraAberta = obraAbertaId ? projetos.find((p) => p.id === obraAbertaId) ?? null : null;
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("Todos");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);
  const [statusFiltroAberto, setStatusFiltroAberto] = useState(false);
  const statusFiltroRef = useRef<HTMLDivElement>(null);

  // Vindo de "Aprovar projeto" nos Orçamentos: abre direto na pasta da obra
  // recém-criada.
  useEffect(() => {
    if (obraParaAbrir && projetos.some((p) => p.id === obraParaAbrir)) {
      setObraAbertaId(obraParaAbrir);
      onObraAberta?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraParaAbrir, projetos]);

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAberto(false);
      }
      if (statusFiltroRef.current && !statusFiltroRef.current.contains(e.target as Node)) {
        setStatusFiltroAberto(false);
      }
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, []);

  const periodoLabel = PERIODOS.find((p) => p.key === periodo)!.label;

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const dias = PERIODOS.find((p) => p.key === periodo)!.dias;
    const limite = dias !== null ? new Date() : null;
    if (limite) {
      limite.setHours(0, 0, 0, 0);
      limite.setDate(limite.getDate() - (dias! - 1));
    }

    return clientes
      // Só aparecem aqui os clientes que já têm alguma obra. Quem só
      // pediu orçamento (ainda não aprovado) fica só na aba Orçamentos.
      .filter((c) => projetosDoCliente(c, projetos).length > 0)
      .filter((c) => {
        if (!limite) return true;
        const d = new Date((c.criado_em ?? "").slice(0, 10) + "T00:00:00");
        return d >= limite;
      })
      .map((c) => ({
        c,
        obras: projetosDoCliente(c, projetos).filter(
          (p) => statusFiltro === "Todos" || p.status === statusFiltro
        ),
        pessoas: pessoasCliente.filter((p) => p.cliente_id === c.id),
      }))
      .filter(({ obras }) => obras.length > 0)
      .filter(({ c, obras, pessoas }) => {
        if (!q) return true;
        const nomesObra = obras.map((p) => (p.projeto ?? "").toLowerCase());
        const engenharias = obras.map((p) => (p.engenharia ?? "").toLowerCase());
        const nomesPessoas = pessoas.map((p) => (p.nome ?? "").toLowerCase());
        const telefonesPessoas = pessoas.map((p) => (p.telefone ?? "").toLowerCase());
        return (
          c.nome.toLowerCase().includes(q) ||
          (c.documento ?? "").toLowerCase().includes(q) ||
          nomesObra.some((n) => n.includes(q)) ||
          engenharias.some((e) => e.includes(q)) ||
          nomesPessoas.some((n) => n.includes(q)) ||
          telefonesPessoas.some((t) => t.includes(q))
        );
      })
      .sort((a, b) => a.c.nome.localeCompare(b.c.nome));
  }, [clientes, projetos, pessoasCliente, busca, periodo, statusFiltro]);

  const resumoObras = useMemo(() => {
    const todasObras = lista.flatMap(({ obras }) => obras);
    return {
      total: todasObras.length,
      emExecucao: todasObras.filter((o) => o.status === "Em execução (projeto preliminar)").length,
      finalizadas: todasObras.filter((o) => o.status === "Concluído (projeto executivo)").length,
    };
  }, [lista]);

  if (obraAberta) {
    return (
      <PastaObra
        projeto={obraAberta}
        onVoltar={() => setObraAbertaId(null)}
        onSalvar={onAtualizarObra}
      />
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar parceiro, obra, engenharia ou telefone…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />

        <div ref={filtroRef} className="relative">
          <button
            onClick={() => setFiltroAberto((v) => !v)}
            className={`t-colors flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
              periodo !== "todos"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            <FunnelIcon />
            {periodoLabel}
          </button>
          {filtroAberto && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-36 overflow-hidden rounded-xl border border-line glass-strong shadow-card">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPeriodo(p.key);
                    setFiltroAberto(false);
                  }}
                  className={`t-colors block w-full px-3 py-2 text-left text-xs font-medium ${
                    periodo === p.key
                      ? "bg-brand-soft text-brand-dark"
                      : "text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={statusFiltroRef} className="relative">
          <button
            onClick={() => setStatusFiltroAberto((v) => !v)}
            className={`t-colors flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
              statusFiltro !== "Todos"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            {statusFiltro}
          </button>
          {statusFiltroAberto && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-line glass-strong shadow-card">
              {["Todos", ...STATUS_PROJETO].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFiltro(s);
                    setStatusFiltroAberto(false);
                  }}
                  className={`t-colors block w-full px-3 py-2 text-left text-xs font-medium ${
                    statusFiltro === s
                      ? "bg-brand-soft text-brand-dark"
                      : "text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNovaObra}
            className="t-colors inline-flex items-center gap-2 rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-soft"
          >
            + Nova obra
          </button>
          <button
            onClick={onNew}
            className="t-colors inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            + Novo parceiro
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span>
          <span className="tnum font-bold text-ink">{resumoObras.total}</span> obra(s)
        </span>
        <span>
          <span className="tnum font-bold text-brand">{resumoObras.emExecucao}</span> em execução
        </span>
        <span>
          <span className="tnum font-bold text-emerald-500">{resumoObras.finalizadas}</span> finalizadas
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              {busca || periodo !== "todos"
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente com obra ainda"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Clientes aparecem aqui a partir do momento em que têm uma obra
              cadastrada (ou um orçamento aprovado). Enquanto isso, eles ficam
              só na aba Orçamentos.
            </p>
          </div>
        ) : (
          lista.map(({ c, obras, pessoas }) => (
            <div
              key={c.id}
              className="rounded-2xl border border-line glass p-4 shadow-card sm:p-5"
            >
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink">
                      {c.nome}
                    </h3>
                    <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                      {c.tipo_pessoa === "PF" ? "PF" : "PJ"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {[c.documento, c.endereco].filter(Boolean).join(" · ") || "Sem endereço cadastrado"}
                  </p>
                  {pessoas.length > 0 ? (
                    <p className="mt-1 text-xs text-ink-soft">
                      {pessoas
                        .map((p) => [p.nome, p.telefone].filter(Boolean).join(" · "))
                        .join(" | ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink-faint">Nenhuma pessoa cadastrada</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(c)}
                    className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
                  >
                    Editar
                  </button>
                  {confirmando === c.id ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <button
                        onClick={() => {
                          onDelete(c);
                          setConfirmando(null);
                        }}
                        className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setConfirmando(null)}
                        className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5"
                      >
                        Não
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmando(c.id)}
                      className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Obras ({obras.length})
                </p>
                <div className="space-y-2">
                  {obras.map((o) => {
                    const s = statsObra(o);
                    return (
                      <button
                        key={o.id}
                        onClick={() => setObraAbertaId(o.id)}
                        className="t-colors block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-left hover:border-brand/40 hover:bg-brand-soft/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                            {o.projeto || "Obra sem nome"}
                          </span>
                          <span
                            className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              o.com_imposto
                                ? "bg-sky-500/15 text-sky-600"
                                : "bg-ink/10 text-ink-soft"
                            }`}
                            title={o.com_imposto ? "Imposto incluído (Nota Fiscal)" : "Sem imposto (Recibo)"}
                          >
                            {o.com_imposto ? "NF" : "Recibo"}
                          </span>
                          <span
                            className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              STATUS_COR[o.status] ?? "bg-ink/10 text-ink-soft"
                            }`}
                          >
                            {o.status}
                          </span>
                          <span className="flex-shrink-0 text-ink-faint">›</span>
                        </div>
                        {o.endereco && (
                          <p className="mt-0.5 truncate text-xs text-ink-faint">{o.endereco}</p>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
                          <Mini label="Contratado" value={brl(s.contratado)} compact />
                          <Mini label="Recebido" value={brl(s.recebido)} tone="emerald" compact />
                          <Mini label="A receber" value={brl(s.aReceber)} tone="amber" compact />
                          <Mini
                            label="RT"
                            value={!s.temRt ? "—" : s.rt > 0 ? brl(s.rt) : "Pago"}
                            tone={s.temRt && s.rt === 0 ? "emerald" : undefined}
                            compact
                          />
                          <Mini
                            label="ART"
                            value={!s.temArt ? "—" : s.art > 0 ? brl(s.art) : "Pago"}
                            tone={s.temArt && s.art === 0 ? "emerald" : undefined}
                            compact
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber";
  compact?: boolean;
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-500"
      : tone === "amber"
      ? "text-amber-500"
      : "text-ink";
  return (
    <div className={`rounded-lg border border-line bg-canvas/60 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className={`tnum mt-0.5 ${compact ? "text-xs" : "text-sm"} font-bold ${color}`}>{value}</p>
    </div>
  );
}
