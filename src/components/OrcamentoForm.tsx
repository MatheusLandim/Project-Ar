"use client";

import { useState } from "react";
import { Overlay } from "@/components/ProjectForm";
import { Orcamento, ItemOrcamento, STATUS_ORCAMENTO, totalOrcamento } from "@/lib/types";
import { ORC_DEFAULTS } from "@/lib/orcamento-defaults";
import { brl } from "@/lib/format";

export type OrcamentoInput = {
  numero: string | null;
  cliente_nome: string;
  titulo: string;
  status: string;
  intro: string;
  escopo: string;
  ambientes: string;
  normas: string;
  servicos: string;
  revisoes: string;
  nao_inclusos: string;
  itens: ItemOrcamento[];
  desconto: number;
  condicoes_pagamento: string;
  prazos: string;
  validade_dias: number;
  fecho: string;
  signatario_nome: string;
  signatario_cargo: string;
};

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink";

export function OrcamentoForm({
  initial,
  clientes = [],
  proximoNumero,
  onCancel,
  onSave,
}: {
  initial?: Orcamento;
  clientes?: { id: string; nome: string }[];
  proximoNumero: string;
  onCancel: () => void;
  onSave: (data: OrcamentoInput) => Promise<void>;
}) {
  const [numero] = useState(initial?.numero ?? proximoNumero);
  const [cliente, setCliente] = useState(initial?.cliente_nome ?? "");
  const [titulo, setTitulo] = useState(initial?.titulo ?? ORC_DEFAULTS.titulo);
  const [status, setStatus] = useState(initial?.status ?? "Rascunho");
  const [itens, setItens] = useState<ItemOrcamento[]>(
    initial?.itens?.length
      ? initial.itens
      : [{ descricao: "Projeto de Climatização", valor: 0 }]
  );
  const [desconto, setDesconto] = useState(
    initial ? String(initial.desconto ?? 0) : "0"
  );
  const [validade, setValidade] = useState(
    String(initial?.validade_dias ?? ORC_DEFAULTS.validade_dias)
  );
  const [signNome, setSignNome] = useState(
    initial?.signatario_nome ?? ORC_DEFAULTS.signatario_nome
  );
  const [signCargo, setSignCargo] = useState(
    initial?.signatario_cargo ?? ORC_DEFAULTS.signatario_cargo
  );
  const [condicoes, setCondicoes] = useState(
    initial?.condicoes_pagamento ?? ORC_DEFAULTS.condicoes_pagamento
  );
  const [prazos, setPrazos] = useState(initial?.prazos ?? ORC_DEFAULTS.prazos);

  // Textos longos (avançado)
  const [intro, setIntro] = useState(initial?.intro ?? ORC_DEFAULTS.intro);
  const [escopo, setEscopo] = useState(initial?.escopo ?? ORC_DEFAULTS.escopo);
  const [ambientes, setAmbientes] = useState(
    initial?.ambientes ?? ORC_DEFAULTS.ambientes
  );
  const [normas, setNormas] = useState(initial?.normas ?? ORC_DEFAULTS.normas);
  const [servicos, setServicos] = useState(
    initial?.servicos ?? ORC_DEFAULTS.servicos
  );
  const [revisoes, setRevisoes] = useState(
    initial?.revisoes ?? ORC_DEFAULTS.revisoes
  );
  const [naoInclusos, setNaoInclusos] = useState(
    initial?.nao_inclusos ?? ORC_DEFAULTS.nao_inclusos
  );
  const [fecho, setFecho] = useState(initial?.fecho ?? ORC_DEFAULTS.fecho);

  const [avancado, setAvancado] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = totalOrcamento({ itens, desconto: Number(desconto) || 0 });

  function setItem(i: number, campo: keyof ItemOrcamento, v: string) {
    setItens((arr) =>
      arr.map((it, idx) =>
        idx === i
          ? { ...it, [campo]: campo === "valor" ? Number(v) || 0 : v }
          : it
      )
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      numero,
      cliente_nome: cliente.trim(),
      titulo: titulo.trim() || "Proposta de Projeto",
      status,
      intro,
      escopo,
      ambientes,
      normas,
      servicos,
      revisoes,
      nao_inclusos: naoInclusos,
      itens: itens.filter((i) => i.descricao.trim() || i.valor),
      desconto: Number(desconto) || 0,
      condicoes_pagamento: condicoes,
      prazos,
      validade_dias: Number(validade) || 15,
      fecho,
      signatario_nome: signNome.trim(),
      signatario_cargo: signCargo.trim(),
    });
    setSaving(false);
  }

  return (
    <Overlay onClose={onCancel}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl glass-strong shadow-card">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">
            {initial ? "Editar orçamento" : "Novo orçamento"}{" "}
            <span className="text-ink-faint">#{numero}</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/5"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente" required>
              <input
                required
                list="orc-clientes"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={input}
                placeholder="Nome do cliente"
              />
              <datalist id="orc-clientes">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input}
              >
                {STATUS_ORCAMENTO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Validade (dias)">
              <input
                type="number"
                min="1"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className={`${input} tnum`}
              />
            </Field>
          </div>

          {/* Itens */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Itens do orçamento
            </p>
            <div className="space-y-2">
              {itens.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={it.descricao}
                    onChange={(e) => setItem(i, "descricao", e.target.value)}
                    placeholder="Serviço"
                    className={`${input} flex-1`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={it.valor || ""}
                    onChange={(e) => setItem(i, "valor", e.target.value)}
                    placeholder="0,00"
                    className={`${input} tnum w-32`}
                  />
                  <button
                    type="button"
                    onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))}
                    className="rounded-lg px-2 text-ink-faint hover:bg-ink/5"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItens((a) => [...a, { descricao: "", valor: 0 }])}
              className="mt-2 rounded-lg border border-dashed border-brand/40 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft"
            >
              + Adicionar item
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Desconto (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className={`${input} tnum`}
              />
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-lg bg-brand-soft px-3 py-2.5 text-sm text-brand-dark">
                Total: <strong className="tnum">{brl(total)}</strong>
              </div>
            </div>
          </div>

          <Field label="Condições de pagamento">
            <textarea
              rows={2}
              value={condicoes}
              onChange={(e) => setCondicoes(e.target.value)}
              className={`${input} resize-none`}
            />
          </Field>
          <Field label="Prazos">
            <textarea
              rows={2}
              value={prazos}
              onChange={(e) => setPrazos(e.target.value)}
              className={`${input} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Assinatura — nome">
              <input
                value={signNome}
                onChange={(e) => setSignNome(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Assinatura — cargo">
              <input
                value={signCargo}
                onChange={(e) => setSignCargo(e.target.value)}
                className={input}
              />
            </Field>
          </div>

          {/* Avançado: textos da proposta */}
          <div className="rounded-xl border border-line">
            <button
              type="button"
              onClick={() => setAvancado((a) => !a)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink"
            >
              Textos da proposta (escopo, normas, serviços…)
              <span className={avancado ? "rotate-90" : ""}>›</span>
            </button>
            {avancado && (
              <div className="space-y-3 border-t border-line p-4">
                <Mini label="Introdução" value={intro} set={setIntro} rows={4} />
                <Mini label="1. Escopo" value={escopo} set={setEscopo} rows={2} />
                <Mini label="2. Ambientes" value={ambientes} set={setAmbientes} rows={2} />
                <Mini label="3. Normas técnicas" value={normas} set={setNormas} rows={4} />
                <Mini label="4. Descrição dos serviços" value={servicos} set={setServicos} rows={8} />
                <Mini label="5. Revisões" value={revisoes} set={setRevisoes} rows={3} />
                <Mini label="6. Não inclusos" value={naoInclusos} set={setNaoInclusos} rows={4} />
                <Mini label="Fechamento" value={fecho} set={setFecho} rows={3} />
              </div>
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="t-colors rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar orçamento"}
          </button>
        </footer>
      </form>
    </Overlay>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}

function Mini({
  label,
  value,
  set,
  rows,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink"
      />
    </label>
  );
}
