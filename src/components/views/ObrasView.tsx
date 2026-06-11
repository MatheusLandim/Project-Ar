"use client";

import { useMemo, useState } from "react";
import { Projeto, STATUS_PROJETO } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";

export function ObrasView({
  projetos,
  reload,
  onNew,
  onEdit,
}: {
  projetos: Projeto[];
  reload: () => void;
  onNew: () => void;
  onEdit: (p: Projeto) => void;
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return projetos.filter((p) => {
      const okStatus = filtro === "Todos" || p.status === filtro;
      const okBusca =
        !q ||
        p.cliente.toLowerCase().includes(q) ||
        p.projeto.toLowerCase().includes(q) ||
        (p.tipo ?? "").toLowerCase().includes(q) ||
        (p.engenharia ?? "").toLowerCase().includes(q) ||
        (p.endereco ?? "").toLowerCase().includes(q);
      return okStatus && okBusca;
    });
  }, [projetos, busca, filtro]);

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente, obra, engenharia, endereço…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {["Todos", ...STATUS_PROJETO].map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
                filtro === s
                  ? "bg-ink text-canvas"
                  : "glass text-ink-soft hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {visiveis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-lg font-bold text-ink">
              {busca || filtro !== "Todos"
                ? "Nenhuma obra encontrada"
                : "Cadastre sua primeira obra"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              {busca || filtro !== "Todos"
                ? "Ajuste a busca ou o filtro de status."
                : "Registre um contrato para acompanhar status, RT, pagamentos e documentos."}
            </p>
            {!busca && filtro === "Todos" && (
              <button
                onClick={onNew}
                className="t-colors mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
              >
                + Nova obra
              </button>
            )}
          </div>
        ) : (
          visiveis.map((p) => (
            <ProjectCard
              key={p.id}
              projeto={p}
              onChanged={reload}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
