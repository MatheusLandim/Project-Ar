"use client";

import { Orcamento } from "@/lib/types";
import { OrcamentoDoc } from "@/components/OrcamentoDoc";

export function OrcamentoViewer({
  orc,
  onClose,
}: {
  orc: Orcamento;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="truncate font-semibold text-ink">
          Orçamento — {orc.cliente_nome}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            Baixar PDF
          </button>
          <button
            onClick={onClose}
            className="t-colors rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Fechar
          </button>
        </div>
      </div>

      <div
        className="flex justify-center overflow-auto bg-slate-300 p-4"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="shadow-2xl">
          <OrcamentoDoc orc={orc} />
        </div>
      </div>
    </div>
  );
}
