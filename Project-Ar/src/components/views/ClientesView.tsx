"use client";

import { useMemo, useState } from "react";
import { Cliente, Projeto, pagamentoStatus } from "@/lib/types";
import { brl } from "@/lib/format";

function projetosDoCliente(c: Cliente, projetos: Projeto[]) {
  const nome = c.nome.trim().toLowerCase();
  return projetos.filter(
    (p) =>
      p.cliente_id === c.id ||
      (!p.cliente_id && (p.cliente ?? "").trim().toLowerCase() === nome)
  );
}

export function ClientesView({
  clientes,
  projetos,
  onNew,
  onEdit,
  onDelete,
}: {
  clientes: Cliente[];
  projetos: Projeto[];
  onNew: () => void;
  onEdit: (c: Cliente) => void;
  onDelete: (c: Cliente) => void;
}) {
  const [busca, setBusca] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientes
      .map((c) => {
        const obras = projetosDoCliente(c, projetos);
        let contratado = 0,
          recebido = 0,
          aReceber = 0;
        for (const p of obras) {
          if (p.status !== "Cancelado") contratado += Number(p.valor_total);
          for (const pg of p.pagamentos) {
            const st = pagamentoStatus(pg);
            if (st === "pago") recebido += Number(pg.valor);
            else aReceber += Number(pg.valor);
          }
        }
        return { c, obras: obras.length, contratado, recebido, aReceber };
      })
      .filter(
        ({ c }) =>
          !q ||
          c.nome.toLowerCase().includes(q) ||
          (c.documento ?? "").toLowerCase().includes(q) ||
          (c.contato ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => a.c.nome.localeCompare(b.c.nome));
  }, [clientes, projetos, busca]);

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente, CNPJ ou contato…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <button
          onClick={onNew}
          className="t-colors inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
        >
          + Novo cliente
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              {busca ? "Nenhum cliente encontrado" : "Cadastre seu primeiro cliente"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Tenha a ficha de cada cliente (CNPJ, contato) e veja tudo o que ele
              já contratou num só lugar.
            </p>
          </div>
        ) : (
          lista.map(({ c, obras, contratado, recebido, aReceber }) => (
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
                    {[c.documento, c.contato, c.telefone, c.email]
                      .filter(Boolean)
                      .join(" · ") || "Sem dados de contato"}
                  </p>
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

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Obras" value={String(obras)} />
                <Mini label="Contratado" value={brl(contratado)} />
                <Mini label="Recebido" value={brl(recebido)} tone="emerald" />
                <Mini label="A receber" value={brl(aReceber)} tone="amber" />
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
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-500"
      : tone === "amber"
      ? "text-amber-500"
      : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className={`tnum mt-0.5 text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
