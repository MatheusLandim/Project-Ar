"use client";

import { useState } from "react";
import {
  Projeto,
  STATUS_PROJETO,
  TIPOS_PROJETO,
} from "@/lib/types";

export type ProjetoInput = {
  cliente: string;
  projeto: string;
  tipo: string;
  valor_total: number;
  status: string;
  data_inicio: string | null;
  data_previsao: string | null;
  observacoes: string | null;
};

export function ProjectForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Projeto;
  onCancel: () => void;
  onSave: (data: ProjetoInput) => Promise<void>;
}) {
  const [cliente, setCliente] = useState(initial?.cliente ?? "");
  const [projeto, setProjeto] = useState(initial?.projeto ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "");
  const [valor, setValor] = useState(
    initial ? String(initial.valor_total) : ""
  );
  const [status, setStatus] = useState(initial?.status ?? "Proposta");
  const [inicio, setInicio] = useState(initial?.data_inicio ?? "");
  const [previsao, setPrevisao] = useState(initial?.data_previsao ?? "");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      cliente: cliente.trim(),
      projeto: projeto.trim(),
      tipo: tipo.trim() || "",
      valor_total: Number(valor) || 0,
      status,
      data_inicio: inicio || null,
      data_previsao: previsao || null,
      observacoes: obs.trim() || null,
    });
    setSaving(false);
  }

  return (
    <Overlay onClose={onCancel}>
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-card"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">
            {initial ? "Editar projeto" : "Novo projeto"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-slate-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente" required>
              <input
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={input}
                placeholder="Ex.: Condomínio Solar"
              />
            </Field>
            <Field label="Projeto / Obra" required>
              <input
                required
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                className={input}
                placeholder="Ex.: VRF 3 pavimentos"
              />
            </Field>
            <Field label="Tipo">
              <input
                list="tipos"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={input}
                placeholder="Residencial, Comercial…"
              />
              <datalist id="tipos">
                {TIPOS_PROJETO.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Valor total do contrato (R$)" required>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`${input} tnum`}
                placeholder="0,00"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input}
              >
                {STATUS_PROJETO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <input
                  type="date"
                  value={inicio ?? ""}
                  onChange={(e) => setInicio(e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Previsão">
                <input
                  type="date"
                  value={previsao ?? ""}
                  onChange={(e) => setPrevisao(e.target.value)}
                  className={input}
                />
              </Field>
            </div>
          </div>

          <Field label="Observações">
            <textarea
              value={obs ?? ""}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              className={`${input} resize-none`}
              placeholder="Escopo, condições de pagamento, anotações…"
            />
          </Field>
        </div>

        <footer className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar projeto"}
          </button>
        </footer>
      </form>
    </Overlay>
  );
}

export function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
        {children}
      </div>
    </div>
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

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink";
