"use client";

import { useState } from "react";
import { Cliente, PessoaCliente } from "@/lib/types";
import { Overlay } from "@/components/ProjectForm";

export type PessoaInput = {
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
};

export type ClienteInput = {
  nome: string;
  tipo_pessoa: string;
  documento: string | null;
  endereco: string | null;
  observacoes: string | null;
  pasta_url: string | null;
  pessoas: PessoaInput[];
};

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink";

function pessoaVazia(): PessoaInput {
  return { nome: "", telefone: null, email: null, data_nascimento: null };
}

export function ClienteForm({
  initial,
  initialPessoas,
  onCancel,
  onSave,
}: {
  initial?: Cliente;
  initialPessoas?: PessoaCliente[];
  onCancel: () => void;
  onSave: (data: ClienteInput) => Promise<void>;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [tipo, setTipo] = useState(initial?.tipo_pessoa ?? "PJ");
  const [doc, setDoc] = useState(initial?.documento ?? "");
  const [endereco, setEndereco] = useState(initial?.endereco ?? "");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [pessoas, setPessoas] = useState<PessoaInput[]>(
    initialPessoas && initialPessoas.length > 0
      ? initialPessoas.map((p) => ({
          nome: p.nome,
          telefone: p.telefone,
          email: p.email,
          data_nascimento: p.data_nascimento,
        }))
      : [pessoaVazia()]
  );
  const [saving, setSaving] = useState(false);

  function atualizarPessoa(i: number, campo: keyof PessoaInput, valor: string) {
    setPessoas((arr) =>
      arr.map((p, idx) => (idx === i ? { ...p, [campo]: valor || null } : p))
    );
  }
  function adicionarPessoa() {
    setPessoas((arr) => [...arr, pessoaVazia()]);
  }
  function removerPessoa(i: number) {
    setPessoas((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      tipo_pessoa: tipo,
      documento: doc.trim() || null,
      endereco: endereco.trim() || null,
      observacoes: obs.trim() || null,
      pasta_url: initial?.pasta_url ?? null,
      pessoas: pessoas.filter((p) => p.nome.trim()).map((p) => ({ ...p, nome: p.nome.trim() })),
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
            {initial ? "Editar parceiro" : "Novo parceiro"}
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

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipo("PJ")}
                  className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                    tipo === "PJ"
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-line text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  Pessoa Jurídica
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("PF")}
                  className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                    tipo === "PF"
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-line text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  Pessoa Física
                </button>
              </div>
            </Field>
            <Field label={tipo === "PF" ? "CPF" : "CNPJ"}>
              <input
                value={doc ?? ""}
                onChange={(e) => setDoc(e.target.value)}
                className={input}
                placeholder={tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </Field>
          </div>

          <Field label="Endereço">
            <input
              value={endereco ?? ""}
              onChange={(e) => setEndereco(e.target.value)}
              className={input}
              placeholder="Cidade / endereço"
            />
          </Field>

          <div className="border-t border-line pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Pessoas dessa empresa
              </span>
              <button
                type="button"
                onClick={adicionarPessoa}
                className="t-colors rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-ink/5"
              >
                + Adicionar pessoa
              </button>
            </div>

            <div className="space-y-3">
              {pessoas.map((p, i) => (
                <div key={i} className="rounded-xl border border-line bg-canvas/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink-faint">
                      Pessoa {i + 1}
                    </span>
                    {pessoas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerPessoa(i)}
                        className="t-colors rounded-md px-1.5 py-0.5 text-xs text-rose-500 hover:bg-rose-500/10"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      value={p.nome}
                      onChange={(e) => atualizarPessoa(i, "nome", e.target.value)}
                      className={input}
                      placeholder="Nome"
                    />
                    <input
                      value={p.telefone ?? ""}
                      onChange={(e) => atualizarPessoa(i, "telefone", e.target.value)}
                      className={input}
                      placeholder="Telefone / WhatsApp"
                    />
                    <input
                      type="email"
                      value={p.email ?? ""}
                      onChange={(e) => atualizarPessoa(i, "email", e.target.value)}
                      className={input}
                      placeholder="E-mail"
                    />
                    <input
                      type="date"
                      value={p.data_nascimento ?? ""}
                      onChange={(e) => atualizarPessoa(i, "data_nascimento", e.target.value)}
                      className={input}
                    />
                  </div>
                </div>
              ))}
            </div>
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
            {saving ? "Salvando…" : "Salvar parceiro"}
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
