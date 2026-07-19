"use client";

import { useState } from "react";
import { Overlay } from "@/components/ProjectForm";
import {
  ContaPagar,
  ContaReceber,
  DespesaFixa,
  Fornecedor,
  Cliente,
  Projeto,
  ProLabore,
  NotaFiscal,
  TIPOS_CONTA_PAGAR,
  TIPOS_CONTA_RECEBER,
  VINCULOS,
  VinculoTipo,
  CATEGORIAS_DESPESA,
  mesReferenciaAtual,
} from "@/lib/types";
import { hoje } from "@/lib/format";

export const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink";

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

function ModalShell({
  title,
  onCancel,
  onSubmit,
  saving,
  submitLabel,
  children,
}: {
  title: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Overlay onClose={onCancel}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-2xl glass-strong shadow-card"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
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
          {children}
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
            {saving ? "Salvando…" : submitLabel}
          </button>
        </footer>
      </form>
    </Overlay>
  );
}

// ===================== Cadastro rápido: Fornecedor =====================

export type FornecedorInput = {
  nome: string;
  cnpj_cpf: string | null;
  categoria: string | null;
  pasta_url: string | null;
};

export function FornecedorQuickForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (data: FornecedorInput) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pasta, setPasta] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      cnpj_cpf: doc.trim() || null,
      categoria: categoria.trim() || null,
      pasta_url: pasta.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title="Novo fornecedor"
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar fornecedor"
    >
      <Field label="Nome / Razão social" required>
        <input required value={nome} onChange={(e) => setNome(e.target.value)} className={input} />
      </Field>
      <Field label="CNPJ / CPF">
        <input value={doc} onChange={(e) => setDoc(e.target.value)} className={input} />
      </Field>
      <Field label="Categoria" hint="Ex.: material, ferramenta, serviço">
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input} />
      </Field>
      <Field label="Link da pasta (nuvem)">
        <input value={pasta} onChange={(e) => setPasta(e.target.value)} className={input} placeholder="https://..." />
      </Field>
    </ModalShell>
  );
}

// ===================== Cadastro rápido: Cliente =====================

export type ClienteQuickInput = {
  nome: string;
  tipo_pessoa: string;
  documento: string | null;
  pasta_url: string | null;
};

export function ClienteQuickForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (data: ClienteQuickInput) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [pasta, setPasta] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      tipo_pessoa: "PJ",
      documento: doc.trim() || null,
      pasta_url: pasta.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title="Novo cliente"
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar cliente"
    >
      <Field label="Nome / Razão social" required>
        <input required value={nome} onChange={(e) => setNome(e.target.value)} className={input} />
      </Field>
      <Field label="CNPJ / CPF">
        <input value={doc} onChange={(e) => setDoc(e.target.value)} className={input} />
      </Field>
      <Field label="Link da pasta (nuvem)" hint="Notas, boletos e comprovantes deste cliente puxam esse link">
        <input value={pasta} onChange={(e) => setPasta(e.target.value)} className={input} placeholder="https://..." />
      </Field>
    </ModalShell>
  );
}

// ===================== Conta a Pagar =====================

export type ContaPagarInput = Omit<ContaPagar, "id" | "criado_em">;

export function ContaPagarForm({
  initial,
  fornecedores,
  projetos,
  onCancel,
  onSave,
  onNovoFornecedor,
}: {
  initial?: ContaPagar;
  fornecedores: Fornecedor[];
  projetos: Projeto[];
  onCancel: () => void;
  onSave: (data: ContaPagarInput) => Promise<void>;
  onNovoFornecedor: () => void;
}) {
  const [tipo, setTipo] = useState(initial?.tipo ?? "despesa_extra");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedor_id ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? hoje());
  const [dataPagamento, setDataPagamento] = useState(initial?.data_pagamento ?? "");
  const [formaPagamento, setFormaPagamento] = useState(initial?.forma_pagamento ?? "");
  const [anexoUrl, setAnexoUrl] = useState(initial?.anexo_url ?? "");
  const [vinculoTipo, setVinculoTipo] = useState<VinculoTipo>(initial?.vinculo_tipo ?? "nenhum");
  const [obraId, setObraId] = useState(initial?.obra_id ?? "");
  const [pastaUrl, setPastaUrl] = useState(initial?.pasta_url ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  function selecionarFornecedor(id: string) {
    setFornecedorId(id);
    const f = fornecedores.find((x) => x.id === id);
    if (f?.pasta_url && !pastaUrl) setPastaUrl(f.pasta_url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      tipo,
      descricao: descricao.trim(),
      fornecedor_id: fornecedorId || null,
      categoria: categoria.trim() || null,
      valor: Number(valor) || 0,
      vencimento: vencimento || null,
      data_pagamento: dataPagamento || null,
      forma_pagamento: formaPagamento.trim() || null,
      anexo_url: anexoUrl.trim() || null,
      obra_id: vinculoTipo === "obra" ? obraId || null : null,
      vinculo_tipo: vinculoTipo,
      vinculo_id: vinculoTipo === "obra" ? obraId || null : null,
      pasta_url: pastaUrl.trim() || null,
      despesa_fixa_id: initial?.despesa_fixa_id ?? null,
      observacoes: observacoes.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar conta a pagar" : "Novo lançamento — Contas a Pagar"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar lançamento"
    >
      <Field label="Descrição" required>
        <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={input} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={input}>
            {Object.entries(TIPOS_CONTA_PAGAR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Categoria">
          <input
            list="categorias-despesa"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={input}
          />
          <datalist id="categorias-despesa">
            {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="Valor (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Forma de pagamento">
          <input value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={input} placeholder="Pix, boleto, cartão…" />
        </Field>
        <Field label="Vencimento">
          <input type="date" value={vencimento ?? ""} onChange={(e) => setVencimento(e.target.value)} className={input} />
        </Field>
        <Field label="Data do pagamento" hint="Deixe vazio se ainda não pagou">
          <input type="date" value={dataPagamento ?? ""} onChange={(e) => setDataPagamento(e.target.value)} className={input} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fornecedor">
          <div className="flex gap-2">
            <select value={fornecedorId ?? ""} onChange={(e) => selecionarFornecedor(e.target.value)} className={input}>
              <option value="">— nenhum —</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <button type="button" onClick={onNovoFornecedor} className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-ink/5">
              + novo
            </button>
          </div>
          {fornecedorId && fornecedores.find((f) => f.id === fornecedorId)?.pasta_url && (
            <p className="mt-1 text-[11px] text-ink-faint">
              Pasta do fornecedor preenchida automaticamente abaixo — pode ajustar se precisar.
            </p>
          )}
        </Field>
        <Field label="Vínculo">
          <select value={vinculoTipo} onChange={(e) => setVinculoTipo(e.target.value as VinculoTipo)} className={input}>
            {Object.entries(VINCULOS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>

      {vinculoTipo === "obra" && (
        <Field label="Obra vinculada">
          <select value={obraId ?? ""} onChange={(e) => setObraId(e.target.value)} className={input}>
            <option value="">— selecione —</option>
            {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente} · {p.projeto}</option>)}
          </select>
        </Field>
      )}

      <Field label="Link da pasta (nuvem)">
        <input value={pastaUrl} onChange={(e) => setPastaUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
      <Field label="Link do comprovante / boleto / nota">
        <input value={anexoUrl} onChange={(e) => setAnexoUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
      <Field label="Observações">
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={`${input} resize-none`} />
      </Field>
    </ModalShell>
  );
}

// ===================== Conta a Receber =====================

export type ContaReceberInput = Omit<ContaReceber, "id" | "criado_em">;

export function ContaReceberForm({
  initial,
  clientes,
  projetos,
  onCancel,
  onSave,
  onNovoCliente,
}: {
  initial?: ContaReceber;
  clientes: Cliente[];
  projetos: Projeto[];
  onCancel: () => void;
  onSave: (data: ContaReceberInput) => Promise<void>;
  onNovoCliente: () => void;
}) {
  const [clienteId, setClienteId] = useState(initial?.cliente_id ?? "");
  const [obraId, setObraId] = useState(initial?.obra_id ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "boleto");
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? hoje());
  const [dataRecebimento, setDataRecebimento] = useState(initial?.data_recebimento ?? "");
  const [numeroNf, setNumeroNf] = useState(initial?.numero_nf ?? "");
  const [anexoUrl, setAnexoUrl] = useState(initial?.anexo_url ?? "");
  const [pastaUrl, setPastaUrl] = useState(initial?.pasta_url ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  function selecionarCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c?.pasta_url && !pastaUrl) setPastaUrl(c.pasta_url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      cliente_id: clienteId || null,
      obra_id: obraId || null,
      tipo,
      valor: Number(valor) || 0,
      vencimento: vencimento || null,
      data_recebimento: dataRecebimento || null,
      numero_nf: numeroNf.trim() || null,
      anexo_url: anexoUrl.trim() || null,
      pasta_url: pastaUrl.trim() || null,
      observacoes: observacoes.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar conta a receber" : "Novo lançamento — Contas a Receber"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar lançamento"
    >
      <Field label="Cliente">
        <div className="flex gap-2">
          <select value={clienteId ?? ""} onChange={(e) => selecionarCliente(e.target.value)} className={input}>
            <option value="">— nenhum —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button type="button" onClick={onNovoCliente} className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-ink/5">
            + novo
          </button>
        </div>
        {clienteId && clientes.find((c) => c.id === clienteId)?.pasta_url && (
          <p className="mt-1 text-[11px] text-ink-faint">
            Pasta do cliente preenchida automaticamente abaixo — pode ajustar se precisar.
          </p>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Obra vinculada">
          <select value={obraId ?? ""} onChange={(e) => setObraId(e.target.value)} className={input}>
            <option value="">— nenhuma —</option>
            {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente} · {p.projeto}</option>)}
          </select>
        </Field>
        <Field label="Tipo">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={input}>
            {Object.entries(TIPOS_CONTA_RECEBER).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Valor (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Nº da nota fiscal">
          <input value={numeroNf} onChange={(e) => setNumeroNf(e.target.value)} className={input} />
        </Field>
        <Field label="Vencimento">
          <input type="date" value={vencimento ?? ""} onChange={(e) => setVencimento(e.target.value)} className={input} />
        </Field>
        <Field label="Data do recebimento" hint="Deixe vazio se ainda não recebeu">
          <input type="date" value={dataRecebimento ?? ""} onChange={(e) => setDataRecebimento(e.target.value)} className={input} />
        </Field>
      </div>

      <Field label="Link da pasta (nuvem)">
        <input value={pastaUrl} onChange={(e) => setPastaUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
      <Field label="Link do comprovante / boleto / nota">
        <input value={anexoUrl} onChange={(e) => setAnexoUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
      <Field label="Observações">
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={`${input} resize-none`} />
      </Field>
    </ModalShell>
  );
}

// ===================== Despesa Fixa =====================

export type DespesaFixaInput = Omit<DespesaFixa, "id" | "criado_em">;

export function DespesaFixaForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: DespesaFixa;
  onCancel: () => void;
  onSave: (data: DespesaFixaInput) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [valor, setValor] = useState(initial?.valor != null ? String(initial.valor) : "");
  const [dia, setDia] = useState(String(initial?.dia_vencimento ?? 5));
  const [pastaUrl, setPastaUrl] = useState(initial?.pasta_url ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      descricao: descricao.trim(),
      categoria: categoria.trim() || null,
      valor: valor.trim() === "" ? null : Number(valor),
      dia_vencimento: Math.min(31, Math.max(1, Number(dia) || 5)),
      pasta_url: pastaUrl.trim() || null,
      ativo,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar despesa fixa" : "Nova despesa fixa"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar despesa fixa"
    >
      <Field label="Descrição" required hint="Ex.: Contabilidade, DAS, DARF, Convênio, Fatura Cartão">
        <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={input} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          <input
            list="categorias-despesa-fixa"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={input}
          />
          <datalist id="categorias-despesa-fixa">
            {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="Valor fixo (R$)" hint="Deixe vazio se variar todo mês">
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Dia do vencimento" required>
          <input required type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} className={input} />
        </Field>
        <Field label="Ativa?">
          <select value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")} className={input}>
            <option value="1">Sim, gerar todo mês</option>
            <option value="0">Pausada</option>
          </select>
        </Field>
      </div>
      <Field label="Link da pasta (nuvem)">
        <input value={pastaUrl} onChange={(e) => setPastaUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
    </ModalShell>
  );
}

// ===================== Pró-labore =====================

export type ProLaboreInput = Omit<ProLabore, "id" | "criado_em">;

export function ProLaboreForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: ProLabore;
  onCancel: () => void;
  onSave: (data: ProLaboreInput) => Promise<void>;
}) {
  const [mes, setMes] = useState(initial?.mes_referencia ?? mesReferenciaAtual());
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [dataPagamento, setDataPagamento] = useState(initial?.data_pagamento ?? "");
  const [comprovante, setComprovante] = useState(initial?.comprovante_url ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      mes_referencia: mes,
      valor: Number(valor) || 0,
      data_pagamento: dataPagamento || null,
      comprovante_url: comprovante.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar pró-labore" : "Novo pró-labore"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mês de referência" required>
          <input required type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={input} />
        </Field>
        <Field label="Valor (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Data do pagamento">
          <input type="date" value={dataPagamento ?? ""} onChange={(e) => setDataPagamento(e.target.value)} className={input} />
        </Field>
        <Field label="Link do comprovante">
          <input value={comprovante} onChange={(e) => setComprovante(e.target.value)} className={input} placeholder="https://..." />
        </Field>
      </div>
    </ModalShell>
  );
}

// ===================== Nota Fiscal =====================

export type NotaFiscalInput = Omit<NotaFiscal, "id" | "criado_em">;

export function NotaFiscalForm({
  initial,
  clientes,
  fornecedores,
  onCancel,
  onSave,
}: {
  initial?: NotaFiscal;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  onCancel: () => void;
  onSave: (data: NotaFiscalInput) => Promise<void>;
}) {
  const [direcao, setDirecao] = useState(initial?.direcao ?? "emitida");
  const [numero, setNumero] = useState(initial?.numero ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "servico");
  const [clienteId, setClienteId] = useState(initial?.cliente_id ?? "");
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedor_id ?? "");
  const [clienteFornecedor, setClienteFornecedor] = useState(initial?.cliente_fornecedor ?? "");
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [dataEmissao, setDataEmissao] = useState(initial?.data_emissao ?? hoje());
  const [impostos, setImpostos] = useState(initial?.impostos != null ? String(initial.impostos) : "");
  const [status, setStatus] = useState(initial?.status ?? "emitida");
  const [arquivoUrl, setArquivoUrl] = useState(initial?.arquivo_url ?? "");
  const [pastaUrl, setPastaUrl] = useState(initial?.pasta_url ?? "");
  const [saving, setSaving] = useState(false);

  function selecionarCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) {
      if (!clienteFornecedor) setClienteFornecedor(c.nome);
      if (c.pasta_url && !pastaUrl) setPastaUrl(c.pasta_url);
    }
  }
  function selecionarFornecedor(id: string) {
    setFornecedorId(id);
    const f = fornecedores.find((x) => x.id === id);
    if (f) {
      if (!clienteFornecedor) setClienteFornecedor(f.nome);
      if (f.pasta_url && !pastaUrl) setPastaUrl(f.pasta_url);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      direcao,
      numero: numero.trim() || null,
      tipo,
      cliente_fornecedor: clienteFornecedor.trim() || null,
      cliente_id: direcao === "emitida" ? clienteId || null : null,
      fornecedor_id: direcao === "recebida" ? fornecedorId || null : null,
      valor: Number(valor) || 0,
      data_emissao: dataEmissao || null,
      impostos: impostos.trim() === "" ? null : Number(impostos),
      status,
      arquivo_url: arquivoUrl.trim() || null,
      pasta_url: pastaUrl.trim() || null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar nota fiscal" : "Nova nota fiscal"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar nota"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Direção">
          <select value={direcao} onChange={(e) => setDirecao(e.target.value as typeof direcao)} className={input}>
            <option value="emitida">Emitida (venda)</option>
            <option value="recebida">Recebida (compra)</option>
          </select>
        </Field>
        <Field label="Tipo">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={input}>
            <option value="servico">Serviço</option>
            <option value="produto">Produto</option>
          </select>
        </Field>
        <Field label="Número">
          <input value={numero} onChange={(e) => setNumero(e.target.value)} className={input} />
        </Field>

        {direcao === "emitida" ? (
          <Field label="Cliente" hint="Puxa nome e pasta automaticamente">
            <select value={clienteId ?? ""} onChange={(e) => selecionarCliente(e.target.value)} className={input}>
              <option value="">— selecione —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Fornecedor" hint="Puxa nome e pasta automaticamente">
            <select value={fornecedorId ?? ""} onChange={(e) => selecionarFornecedor(e.target.value)} className={input}>
              <option value="">— selecione —</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </Field>
        )}

        <Field label="Valor (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Impostos (R$)">
          <input type="number" step="0.01" value={impostos} onChange={(e) => setImpostos(e.target.value)} className={input} />
        </Field>
        <Field label="Data de emissão">
          <input type="date" value={dataEmissao ?? ""} onChange={(e) => setDataEmissao(e.target.value)} className={input} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={input}>
            <option value="emitida">Emitida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </Field>
      </div>
      <Field label="Link do arquivo (PDF/XML)">
        <input value={arquivoUrl} onChange={(e) => setArquivoUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
      <Field label="Link da pasta (nuvem)" hint="Preenchido automaticamente ao escolher cliente/fornecedor">
        <input value={pastaUrl} onChange={(e) => setPastaUrl(e.target.value)} className={input} placeholder="https://..." />
      </Field>
    </ModalShell>
  );
}
