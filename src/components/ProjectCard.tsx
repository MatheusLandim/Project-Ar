"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, STATUS_PROJETO, pagamentoStatus, rtValor, artValor } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { PaymentManager } from "./PaymentManager";
import { AnexosManager } from "./AnexosManager";

export function ProjectCard({
  projeto,
  onChanged,
  onEdit,
}: {
  projeto: Projeto;
  onChanged: () => void;
  onEdit: (p: Projeto) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [aba, setAba] = useState<"pag" | "doc">("pag");
  const [confirming, setConfirming] = useState(false);

  const recebido = projeto.pagamentos
    .filter((p) => pagamentoStatus(p) === "pago")
    .reduce((s, p) => s + Number(p.valor), 0);
  const total = Number(projeto.valor_total);
  const pct = total > 0 ? Math.min(100, (recebido / total) * 100) : 0;
  const temAtraso = projeto.pagamentos.some(
    (p) => pagamentoStatus(p) === "atrasado"
  );
  const rt = rtValor(projeto);
  const art = artValor(projeto);

  async function mudarStatus(status: string) {
    await supabase.from("projetos").update({ status }).eq("id", projeto.id);
    onChanged();
  }

  async function toggleRtPago() {
    await supabase
      .from("projetos")
      .update({
        rt_pago: !projeto.rt_pago,
        rt_data_pagamento: !projeto.rt_pago ? hoje() : null,
      })
      .eq("id", projeto.id);
    onChanged();
  }

  async function toggleArtPago() {
    await supabase
      .from("projetos")
      .update({
        art_pago: !projeto.art_pago,
        art_data_pagamento: !projeto.art_pago ? hoje() : null,
      })
      .eq("id", projeto.id);
    onChanged();
  }

  async function excluir() {
    await supabase.from("projetos").delete().eq("id", projeto.id);
    onChanged();
  }

  return (
    <div className="animate-fade-up t-colors overflow-hidden rounded-2xl glass shadow-card hover:shadow-glow">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink">
              {projeto.cliente}
            </h3>
            <StatusBadge status={projeto.status} />
            {temAtraso && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-500 ring-1 ring-inset ring-rose-500/30">
                ● Pagamento atrasado
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {projeto.projeto}
            {projeto.tipo && (
              <span className="text-ink-faint"> · {projeto.tipo}</span>
            )}
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-ink-faint">
            {projeto.engenharia && (
              <p>🏗️ {projeto.engenharia}</p>
            )}
            {projeto.endereco && <p>📍 {projeto.endereco}</p>}
            {(projeto.data_inicio || projeto.data_previsao) && (
              <p>
                {projeto.data_inicio && <>Início {formatDate(projeto.data_inicio)} · </>}
                {projeto.data_previsao && <>Previsão {formatDate(projeto.data_previsao)}</>}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="tnum font-display text-lg font-bold text-ink">
            {brl(total)}
          </p>
          <p className="tnum text-xs text-emerald-500">
            {brl(recebido)} recebido
          </p>
        </div>
      </div>

      {/* RT */}
      {Number(projeto.rt_percentual) > 0 && (
        <div className="mx-4 mb-1 rounded-lg bg-sky-500/10 px-3 py-2 sm:mx-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              RT ({projeto.rt_percentual}%):{" "}
              <strong className="tnum text-ink">{brl(rt)}</strong>
              {projeto.rt_pago && projeto.rt_data_pagamento && (
                <span className="text-emerald-500">
                  {" "}
                  · pago {formatDate(projeto.rt_data_pagamento)}
                </span>
              )}
            </span>
            <button
              onClick={toggleRtPago}
              className={`t-colors rounded-md px-2 py-1 text-xs font-medium ${
                projeto.rt_pago
                  ? "text-ink-soft hover:bg-ink/5"
                  : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
            >
              {projeto.rt_pago ? "RT em aberto" : "Marcar RT pago"}
            </button>
          </div>
          {projeto.rt_obs && (
            <p className="mt-1 text-xs text-ink-faint">
              Pagar a: {projeto.rt_obs}
            </p>
          )}
        </div>
      )}

      {/* ART */}
      {Number(projeto.art_valor) > 0 && (
        <div className="mx-4 mb-1 rounded-lg bg-sky-500/10 px-3 py-2 sm:mx-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              ART (engenheiro):{" "}
              <strong className="tnum text-ink">{brl(art)}</strong>
              {projeto.art_pago && projeto.art_data_pagamento && (
                <span className="text-emerald-500">
                  {" "}
                  · pago {formatDate(projeto.art_data_pagamento)}
                </span>
              )}
            </span>
            <button
              onClick={toggleArtPago}
              className={`t-colors rounded-md px-2 py-1 text-xs font-medium ${
                projeto.art_pago
                  ? "text-ink-soft hover:bg-ink/5"
                  : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
            >
              {projeto.art_pago ? "ART em aberto" : "Marcar ART pago"}
            </button>
          </div>
          {projeto.art_obs && (
            <p className="mt-1 text-xs text-ink-faint">
              Pagar a: {projeto.art_obs}
            </p>
          )}
        </div>
      )}

      {/* Progresso */}
      <div className="px-4 sm:px-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="t-colors inline-flex items-center gap-1 rounded-lg bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/10"
        >
          {open ? "Ocultar" : "Detalhes"}
          <span className="text-ink-faint">
            ({projeto.pagamentos.length} pag · {(projeto.anexos ?? []).length} doc)
          </span>
        </button>

        <select
          value={projeto.status}
          onChange={(e) => mudarStatus(e.target.value)}
          className="t-colors rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
          title="Alterar status"
        >
          {STATUS_PROJETO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => onEdit(projeto)}
          className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
        >
          Editar
        </button>

        <div className="ml-auto">
          {confirming ? (
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Excluir?</span>
              <button
                onClick={excluir}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-line p-4 sm:p-5">
          {projeto.observacoes && (
            <p className="mb-3 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink-soft">
              {projeto.observacoes}
            </p>
          )}

          <div className="mb-3 inline-flex rounded-lg border border-line p-0.5">
            <button
              onClick={() => setAba("pag")}
              className={`t-colors rounded-md px-3 py-1.5 text-sm font-medium ${
                aba === "pag"
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Recebimentos
            </button>
            <button
              onClick={() => setAba("doc")}
              className={`t-colors rounded-md px-3 py-1.5 text-sm font-medium ${
                aba === "doc"
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Documentos
            </button>
          </div>

          {aba === "pag" ? (
            <PaymentManager projeto={projeto} onChanged={onChanged} />
          ) : (
            <AnexosManager projeto={projeto} onChanged={onChanged} />
          )}
        </div>
      )}
    </div>
  );
}
