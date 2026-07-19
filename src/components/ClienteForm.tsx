"use client";

import { useState } from "react";
import { Cliente } from "@/lib/types";
import { Overlay } from "@/components/ProjectForm";

export type ClienteInput = {
  nome: string;
  tipo_pessoa: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  contato: string | null;
  endereco: string | null;
  observacoes: string | null;
  pasta_url: string | null;
};

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink";

export function ClienteForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Cliente;
  onCancel: () => void;
  onSave: (data: ClienteInput) => Promise<void>;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [tipo, setTipo] = useState(initial?.tipo_pessoa ?? "PJ");
  const [doc, setDoc] = useState(initial?.documento ?? "");
  const [contato, setContato] = useState(initial?.contato ?? "");
  const [tel, setTel] = useState(initial?.telefone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [endereco, setEndereco] = useState(initial?.endereco ?? "");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [pastaUrl, setPastaUrl] = useState(initial?.pasta_url ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      tipo_pessoa: tipo,
      documento: doc.trim() || null,
      email: email.trim() || null,
      telefone: tel.trim() || null,
      contato: contato.trim() || null,
      endereco: endereco.trim() || null,
      observacoes: obs.trim() || null,
      pasta_url: pastaUrl.trim() || null,
    });
    setSaving(false);
  }

  return (
    <Overlay onClose={onCancel}>
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl glass-strong shadow-card"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">
            {initial ? "Editar cliente" : "Novo cliente"}
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

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <Field label="Nome / Razão social" required>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={input}
              placeholder="Ex.: Construtora Solar Ltda"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={input}
              >
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
            </Field>
            <Field label={tipo === "PF" ? "CPF" : "CNPJ"}>
              <input
                value={doc ?? ""}
                onChange={(e) => setDoc(e.target.value)}
                className={input}
                placeholder={tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </Field>
            <Field label="Pessoa de contato">
              <input
                value={contato ?? ""}
                onChange={(e) => setContato(e.target.value)}
                className={input}
                placeholder="Ex.: Eng. Carla"
              />
            </Field>
            <Field label="Telefone / WhatsApp">
              <input
                value={tel ?? ""}
                onChange={(e) => setTel(e.target.value)}
                className={input}
                placeholder="(11) 90000-0000"
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={email ?? ""}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                placeholder="contato@cliente.com.br"
              />
            </Field>
            <Field label="Endereço">
              <input
                value={endereco ?? ""}
                onChange={(e) => setEndereco(e.target.value)}
                className={input}
                placeholder="Cidade / endereço"
              />
            </Field>
          </div>

          <Field label="Observações">
            <textarea
              value={obs ?? ""}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              className={`${input} resize-none`}
              placeholder="Condições, histórico, anotações…"
            />
          </Field>

          <Field
            label="Pasta do cliente (nuvem)"
            hint="Link da pasta onde ficam notas fiscais, boletos e comprovantes deste cliente. Os lançamentos financeiros puxam esse link automaticamente."
          >
            <input
              value={pastaUrl ?? ""}
              onChange={(e) => setPastaUrl(e.target.value)}
              className={input}
              placeholder="https://..."
            />
          </Field>
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
            {saving ? "Salvando…" : "Salvar cliente"}
          </button>
        </footer>
      </form>
    </Overlay>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}
