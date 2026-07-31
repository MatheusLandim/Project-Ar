"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Overlay } from "@/components/ProjectForm";
import {
  ContaPagar,
  ContaReceber,
  DespesaFixa,
  ReceitaRecorrente,
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
  FORMAS_PAGAMENTO,
  FORMAS_TRANSFERENCIA,
  PASTAS_MES,
  TipoPasta,
  mesReferenciaAtual,
  pastaCompetenciaTipo,
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
  tipo_pasta: TipoPasta;
  pasta_url: string | null;
};

export function FornecedorQuickForm({
  initial,
  tipoPadrao,
  onCancel,
  onSave,
}: {
  initial?: Fornecedor;
  tipoPadrao?: TipoPasta;
  onCancel: () => void;
  onSave: (data: FornecedorInput) => Promise<void>;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [doc, setDoc] = useState(initial?.cnpj_cpf ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [tipoPasta, setTipoPasta] = useState<TipoPasta>(initial?.tipo_pasta ?? tipoPadrao ?? "variavel");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      cnpj_cpf: doc.trim() || null,
      categoria: categoria.trim() || null,
      tipo_pasta: tipoPasta,
      pasta_url: initial?.pasta_url ?? null,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar pasta" : "Nova pasta"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel={initial ? "Salvar alterações" : "Salvar pasta"}
    >
      <Field label="Tipo de pasta" required hint="Muda só onde ela aparece — a estrutura da pasta é igual nos três casos.">
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setTipoPasta("fixa")}
            className={`t-colors rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              tipoPasta === "fixa"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Padrão (despesas fixas)
          </button>
          <button
            type="button"
            onClick={() => setTipoPasta("variavel")}
            className={`t-colors rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              tipoPasta === "variavel"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Variável (despesas variáveis)
          </button>
          <button
            type="button"
            onClick={() => setTipoPasta("receita_recorrente")}
            className={`t-colors rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              tipoPasta === "receita_recorrente"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Recebimento recorrente (receita)
          </button>
        </div>
      </Field>
      <Field label="Nome / Razão social" required>
        <input required value={nome} onChange={(e) => setNome(e.target.value)} className={input} />
      </Field>
      <Field label="CNPJ / CPF (ou descrição)">
        <input value={doc} onChange={(e) => setDoc(e.target.value)} className={input} placeholder="00.000.000/0000-00 ou uma descrição livre" />
      </Field>
      <Field label="Categoria" hint="Ex.: material, ferramenta, serviço">
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input} />
      </Field>
      <p className="text-[11px] text-ink-faint">
        Notas fiscais, boletos e comprovantes deste fornecedor ficam na pasta interna dele — use o botão 📁 Pasta depois de salvar.
      </p>
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
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome: nome.trim(),
      tipo_pessoa: "PJ",
      documento: doc.trim() || null,
      pasta_url: null,
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
      <p className="text-[11px] text-ink-faint">
        Notas fiscais, boletos e comprovantes deste cliente ficam na pasta interna dele — use o botão 📁 Pasta depois de salvar.
      </p>
    </ModalShell>
  );
}

// ===================== Conta a Pagar =====================

export type ContaPagarInput = Omit<ContaPagar, "id" | "criado_em">;

export function ContaPagarForm({
  initial,
  fornecedores,
  projetos,
  despesasFixas,
  onCancel,
  onSave,
  onNovoFornecedor,
}: {
  initial?: ContaPagar;
  fornecedores: Fornecedor[];
  projetos: Projeto[];
  despesasFixas: DespesaFixa[];
  onCancel: () => void;
  onSave: (data: ContaPagarInput) => Promise<string | null>;
  onNovoFornecedor: () => void;
}) {
  const supabase = createClient();
  const [categoriaDespesa, setCategoriaDespesa] = useState<"fixa" | "variavel">(
    initial?.despesa_fixa_id ? "fixa" : "variavel"
  );
  const [despesaFixaId, setDespesaFixaId] = useState(initial?.despesa_fixa_id ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "despesa_extra");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedor_id ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [formaPagamento, setFormaPagamento] = useState(initial?.forma_pagamento ?? FORMAS_PAGAMENTO[0]);
  const [mesCompetencia, setMesCompetencia] = useState(
    initial?.mes_competencia ?? (initial?.vencimento ? initial.vencimento.slice(0, 7) : mesReferenciaAtual())
  );
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? hoje());
  const [dataPagamento, setDataPagamento] = useState(initial?.data_pagamento ?? "");
  const [vinculoTipo, setVinculoTipo] = useState<VinculoTipo>(initial?.vinculo_tipo ?? "nenhum");
  const [obraId, setObraId] = useState(initial?.obra_id ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [arquivos, setArquivos] = useState<Record<string, File | null>>({
    Boletos: null,
    Comprovantes: null,
    Recibos: null,
    "Notas Fiscais": null,
  });
  const [saving, setSaving] = useState(false);
  const [enviandoArquivos, setEnviandoArquivos] = useState(false);

  function selecionarDespesaFixa(id: string) {
    setDespesaFixaId(id);
    const d = despesasFixas.find((x) => x.id === id);
    if (d) {
      setDescricao(d.descricao);
      if (d.categoria) setCategoria(d.categoria);
      if (d.valor != null) setValor(String(d.valor));
      if (d.fornecedor_id) setFornecedorId(d.fornecedor_id);
    }
  }

  // Fornecedor que hospeda a pasta desse lançamento: direto (variável) ou
  // herdado da despesa fixa selecionada.
  function fornecedorDaPasta(): string | null {
    if (categoriaDespesa === "fixa") {
      const d = despesasFixas.find((x) => x.id === despesaFixaId);
      return d?.fornecedor_id ?? null;
    }
    return fornecedorId || null;
  }

  async function enviarArquivos(lancamentoId: string) {
    const fId = fornecedorDaPasta();
    if (!fId || !mesCompetencia) return;
    const pendentes = Object.entries(arquivos).filter(([, f]) => f);
    if (pendentes.length === 0) return;

    setEnviandoArquivos(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      for (const [tipoDoc, file] of pendentes) {
        if (!file) continue;
        const limpo = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/pastas/fornecedor/${fId}/${Date.now()}_${limpo}`;
        const up = await supabase.storage.from("anexos").upload(path, file);
        if (up.error) continue;
        await supabase.from("documentos").insert({
          entidade_tipo: "fornecedor",
          entidade_id: fId,
          lancamento_tipo: "pagar",
          lancamento_id: lancamentoId,
          pasta: pastaCompetenciaTipo(mesCompetencia, tipoDoc),
          nome: file.name,
          path,
          tamanho: file.size,
        });
      }
    } finally {
      setEnviandoArquivos(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ehFixa = categoriaDespesa === "fixa";
    const id = await onSave({
      tipo,
      descricao: descricao.trim(),
      fornecedor_id: fornecedorId || null,
      categoria: categoria.trim() || null,
      valor: Number(valor) || 0,
      vencimento: vencimento || null,
      data_pagamento: dataPagamento || null,
      forma_pagamento: formaPagamento || null,
      anexo_url: initial?.anexo_url ?? null,
      obra_id: !ehFixa && vinculoTipo === "obra" ? obraId || null : null,
      vinculo_tipo: ehFixa ? "despesa_fixa" : vinculoTipo,
      vinculo_id: ehFixa ? despesaFixaId || null : vinculoTipo === "obra" ? obraId || null : null,
      pasta_url: initial?.pasta_url ?? null,
      despesa_fixa_id: ehFixa ? despesaFixaId || null : null,
      mes_competencia: mesCompetencia || null,
      observacoes: observacoes.trim() || null,
    });
    if (id) await enviarArquivos(id);
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
      <Field label="Tipo de despesa" required>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCategoriaDespesa("fixa")}
            className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              categoriaDespesa === "fixa"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Fixa
          </button>
          <button
            type="button"
            onClick={() => setCategoriaDespesa("variavel")}
            className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              categoriaDespesa === "variavel"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Variável
          </button>
        </div>
      </Field>

      {categoriaDespesa === "fixa" ? (
        <Field label="Qual despesa fixa?" required hint="O anexo desse lançamento vai automático pra pasta dessa despesa, no mês certo.">
          <select
            required
            value={despesaFixaId}
            onChange={(e) => selecionarDespesaFixa(e.target.value)}
            className={input}
          >
            <option value="">— selecione —</option>
            {despesasFixas.map((d) => (
              <option key={d.id} value={d.id}>{d.descricao}</option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Descrição" required>
          <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={input} />
        </Field>
      )}

      {categoriaDespesa === "variavel" && (
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
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Valor (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Forma de pagamento">
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={input}>
            {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <Field
        label="Mês da despesa"
        hint="O mês a que a despesa se refere — ex.: o DAS de junho é pago em julho, mas fica marcado como Junho."
      >
        <input
          type="month"
          value={mesCompetencia}
          onChange={(e) => setMesCompetencia(e.target.value)}
          className={input}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <select value={fornecedorId ?? ""} onChange={(e) => setFornecedorId(e.target.value)} className={input}>
              <option value="">— nenhum —</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <button type="button" onClick={onNovoFornecedor} className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-ink/5">
              + novo
            </button>
          </div>
        </Field>
        {categoriaDespesa === "variavel" && (
          <Field label="Vínculo">
            <select value={vinculoTipo} onChange={(e) => setVinculoTipo(e.target.value as VinculoTipo)} className={input}>
              {Object.entries(VINCULOS)
                .filter(([k]) => k !== "despesa_fixa")
                .map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
            </select>
          </Field>
        )}
      </div>

      {categoriaDespesa === "variavel" && vinculoTipo === "obra" && (
        <Field label="Obra vinculada">
          <select value={obraId ?? ""} onChange={(e) => setObraId(e.target.value)} className={input}>
            <option value="">— selecione —</option>
            {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente} · {p.projeto}</option>)}
          </select>
        </Field>
      )}

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Anexar agora (opcional)
        </p>
        {fornecedorDaPasta() ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PASTAS_MES.map((tipoDoc) => (
              <label key={tipoDoc} className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">{tipoDoc}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xml"
                  onChange={(e) =>
                    setArquivos((prev) => ({ ...prev, [tipoDoc]: e.target.files?.[0] ?? null }))
                  }
                  className="block w-full text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark"
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">
            Selecione uma despesa fixa ou um fornecedor acima pra poder anexar aqui — cada
            arquivo já vai direto pra pasta certa (ano/mês/tipo).
          </p>
        )}
      </div>

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
  fornecedores,
  receitasRecorrentes,
  onCancel,
  onSave,
  onNovoCliente,
}: {
  initial?: ContaReceber;
  clientes: Cliente[];
  projetos: Projeto[];
  fornecedores: Fornecedor[];
  receitasRecorrentes: ReceitaRecorrente[];
  onCancel: () => void;
  onSave: (data: ContaReceberInput) => Promise<string | null>;
  onNovoCliente: () => void;
}) {
  const supabase = createClient();
  const [categoriaReceita, setCategoriaReceita] = useState<"recorrente" | "variavel">(
    initial?.receita_recorrente_id ? "recorrente" : "variavel"
  );
  const [receitaRecorrenteId, setReceitaRecorrenteId] = useState(initial?.receita_recorrente_id ?? "");
  const [clienteId, setClienteId] = useState(initial?.cliente_id ?? "");
  const [obraId, setObraId] = useState(initial?.obra_id ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "boleto");
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [mesCompetencia, setMesCompetencia] = useState(
    initial?.mes_competencia ?? (initial?.vencimento ? initial.vencimento.slice(0, 7) : mesReferenciaAtual())
  );
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? hoje());
  const [dataRecebimento, setDataRecebimento] = useState(initial?.data_recebimento ?? "");
  const [numeroNf, setNumeroNf] = useState(initial?.numero_nf ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [arquivos, setArquivos] = useState<Record<string, File | null>>({
    Boletos: null,
    Comprovantes: null,
    Recibos: null,
    "Notas Fiscais": null,
  });
  const [saving, setSaving] = useState(false);

  function selecionarReceitaRecorrente(id: string) {
    setReceitaRecorrenteId(id);
    const r = receitasRecorrentes.find((x) => x.id === id);
    if (r) {
      if (r.categoria) setNumeroNf(numeroNf); // no-op, mantém
      if (r.valor != null) setValor(String(r.valor));
    }
  }

  function fornecedorDaPasta(): string | null {
    if (categoriaReceita === "recorrente") {
      const r = receitasRecorrentes.find((x) => x.id === receitaRecorrenteId);
      return r?.fornecedor_id ?? null;
    }
    return null;
  }

  async function enviarArquivos(lancamentoId: string) {
    const fId = fornecedorDaPasta();
    if (!fId || !mesCompetencia) return;
    const pendentes = Object.entries(arquivos).filter(([, f]) => f);
    if (pendentes.length === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    for (const [tipoDoc, file] of pendentes) {
      if (!file) continue;
      const limpo = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/pastas/fornecedor/${fId}/${Date.now()}_${limpo}`;
      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) continue;
      await supabase.from("documentos").insert({
        entidade_tipo: "fornecedor",
        entidade_id: fId,
        lancamento_tipo: "receber",
        lancamento_id: lancamentoId,
        pasta: pastaCompetenciaTipo(mesCompetencia, tipoDoc),
        nome: file.name,
        path,
        tamanho: file.size,
      });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ehRecorrente = categoriaReceita === "recorrente";
    const id = await onSave({
      cliente_id: !ehRecorrente ? clienteId || null : null,
      obra_id: !ehRecorrente ? obraId || null : null,
      fornecedor_id: ehRecorrente ? fornecedorDaPasta() : null,
      receita_recorrente_id: ehRecorrente ? receitaRecorrenteId || null : null,
      mes_competencia: mesCompetencia || null,
      tipo,
      valor: Number(valor) || 0,
      vencimento: vencimento || null,
      data_recebimento: dataRecebimento || null,
      numero_nf: numeroNf.trim() || null,
      anexo_url: initial?.anexo_url ?? null,
      pasta_url: initial?.pasta_url ?? null,
      observacoes: observacoes.trim() || null,
    });
    if (id) await enviarArquivos(id);
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
      <Field label="Tipo de recebimento" required>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCategoriaReceita("variavel")}
            className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              categoriaReceita === "variavel"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Ligado a obra/orçamento
          </button>
          <button
            type="button"
            onClick={() => setCategoriaReceita("recorrente")}
            className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
              categoriaReceita === "recorrente"
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-ink-soft hover:bg-ink/5"
            }`}
          >
            Recebimento recorrente
          </button>
        </div>
      </Field>

      {categoriaReceita === "variavel" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <div className="flex gap-2">
              <select value={clienteId ?? ""} onChange={(e) => setClienteId(e.target.value)} className={input}>
                <option value="">— nenhum —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button type="button" onClick={onNovoCliente} className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-ink/5">
                + novo
              </button>
            </div>
          </Field>
          <Field label="Obra vinculada">
            <select value={obraId ?? ""} onChange={(e) => setObraId(e.target.value)} className={input}>
              <option value="">— nenhuma —</option>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente} · {p.projeto}</option>)}
            </select>
          </Field>
        </div>
      ) : (
        <Field
          label="Qual recebimento recorrente?"
          required
          hint="O anexo desse lançamento vai automático pra pasta desse contratante, no mês certo."
        >
          <select
            required
            value={receitaRecorrenteId}
            onChange={(e) => selecionarReceitaRecorrente(e.target.value)}
            className={input}
          >
            <option value="">— selecione —</option>
            {receitasRecorrentes.map((r) => (
              <option key={r.id} value={r.id}>{r.descricao}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Field
          label="Mês da receita"
          hint="Mês a que o recebimento se refere, mesmo se vencer/receber no mês seguinte."
        >
          <input type="month" value={mesCompetencia} onChange={(e) => setMesCompetencia(e.target.value)} className={input} />
        </Field>
        <Field label="Vencimento">
          <input type="date" value={vencimento ?? ""} onChange={(e) => setVencimento(e.target.value)} className={input} />
        </Field>
        <Field label="Data do recebimento" hint="Deixe vazio se ainda não recebeu">
          <input type="date" value={dataRecebimento ?? ""} onChange={(e) => setDataRecebimento(e.target.value)} className={input} />
        </Field>
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Anexar agora (opcional) — boleto, NF ou recibo que a gente emite
        </p>
        {fornecedorDaPasta() ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PASTAS_MES.map((tipoDoc) => (
              <label key={tipoDoc} className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">{tipoDoc}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xml"
                  onChange={(e) =>
                    setArquivos((prev) => ({ ...prev, [tipoDoc]: e.target.files?.[0] ?? null }))
                  }
                  className="block w-full text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark"
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">
            Selecione um recebimento recorrente acima pra poder anexar aqui — cada arquivo já vai
            direto pra pasta certa (ano/mês/tipo).
          </p>
        )}
      </div>

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
  fornecedores,
  onCancel,
  onSave,
}: {
  initial?: DespesaFixa;
  fornecedores: Fornecedor[];
  onCancel: () => void;
  onSave: (data: DespesaFixaInput) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedor_id ?? "");
  const [valor, setValor] = useState(initial?.valor != null ? String(initial.valor) : "");
  const [dia, setDia] = useState(String(initial?.dia_vencimento ?? 5));
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      descricao: descricao.trim(),
      categoria: categoria.trim() || null,
      fornecedor_id: fornecedorId || null,
      valor: valor.trim() === "" ? null : Number(valor),
      dia_vencimento: Math.min(31, Math.max(1, Number(dia) || 5)),
      pasta_url: initial?.pasta_url ?? null,
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
      <Field
        label="Pasta (Fornecedores)"
        hint="A pasta dessa despesa fixa fica dentro dela — cadastre em Fornecedores → Despesas fixas, se ainda não existir."
      >
        <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={input}>
          <option value="">— nenhuma —</option>
          {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
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
    </ModalShell>
  );
}

// ===================== Receita Recorrente =====================

export type ReceitaRecorrenteInput = Omit<ReceitaRecorrente, "id" | "criado_em">;

export function ReceitaRecorrenteForm({
  initial,
  fornecedores,
  onCancel,
  onSave,
}: {
  initial?: ReceitaRecorrente;
  fornecedores: Fornecedor[];
  onCancel: () => void;
  onSave: (data: ReceitaRecorrenteInput) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedor_id ?? "");
  const [valor, setValor] = useState(initial?.valor != null ? String(initial.valor) : "");
  const [dia, setDia] = useState(String(initial?.dia_vencimento ?? 5));
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      descricao: descricao.trim(),
      categoria: categoria.trim() || null,
      fornecedor_id: fornecedorId || null,
      valor: valor.trim() === "" ? null : Number(valor),
      dia_vencimento: Math.min(31, Math.max(1, Number(dia) || 5)),
      ativo,
    });
    setSaving(false);
  }

  return (
    <ModalShell
      title={initial ? "Editar recebimento recorrente" : "Novo recebimento recorrente"}
      onCancel={onCancel}
      onSubmit={submit}
      saving={saving}
      submitLabel="Salvar"
    >
      <Field label="Descrição" required hint="Ex.: Manutenção mensal — Condomínio Alfa">
        <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={input} />
      </Field>
      <Field
        label="Pasta (Fornecedores)"
        hint="A pasta desse contratante fica dentro de Fornecedores → Recebimentos recorrentes."
      >
        <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={input}>
          <option value="">— nenhuma —</option>
          {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input} />
        </Field>
        <Field label="Valor mensal (R$)" hint="Deixe vazio se variar todo mês">
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Dia do vencimento" required>
          <input required type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} className={input} />
        </Field>
        <Field label="Ativo?">
          <select value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")} className={input}>
            <option value="1">Sim, gerar todo mês</option>
            <option value="0">Pausado</option>
          </select>
        </Field>
      </div>
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
  onSave: (data: ProLaboreInput, comprovante: File | null) => Promise<void>;
}) {
  const [mes, setMes] = useState(initial?.mes_referencia ?? mesReferenciaAtual());
  const [valor, setValor] = useState(String(initial?.valor ?? ""));
  const [dataPagamento, setDataPagamento] = useState(initial?.data_pagamento ?? "");
  const [formaTransferencia, setFormaTransferencia] = useState(
    initial?.forma_transferencia ?? FORMAS_TRANSFERENCIA[0]
  );
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(
      {
        mes_referencia: mes,
        valor: Number(valor) || 0,
        data_pagamento: dataPagamento || null,
        forma_transferencia: formaTransferencia || null,
        comprovante_url: initial?.comprovante_url ?? null,
      },
      comprovante
    );
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
        <Field label="Valor retirado (R$)" required>
          <input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        </Field>
        <Field label="Data">
          <input type="date" value={dataPagamento ?? ""} onChange={(e) => setDataPagamento(e.target.value)} className={input} />
        </Field>
        <Field label="Mês de referência" required>
          <input required type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={input} />
        </Field>
        <Field label="Tipo de transferência">
          <select value={formaTransferencia} onChange={(e) => setFormaTransferencia(e.target.value)} className={input}>
            {FORMAS_TRANSFERENCIA.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Comprovante" hint={initial?.comprovante_url ? "Já tem um comprovante anexado — escolher outro arquivo substitui." : undefined}>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => setComprovante(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark"
        />
      </Field>
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
  const [saving, setSaving] = useState(false);

  function selecionarCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c && !clienteFornecedor) setClienteFornecedor(c.nome);
  }
  function selecionarFornecedor(id: string) {
    setFornecedorId(id);
    const f = fornecedores.find((x) => x.id === id);
    if (f && !clienteFornecedor) setClienteFornecedor(f.nome);
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
      arquivo_url: initial?.arquivo_url ?? null,
      pasta_url: initial?.pasta_url ?? null,
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
          <Field label="Cliente" hint="Puxa o nome automaticamente">
            <select value={clienteId ?? ""} onChange={(e) => selecionarCliente(e.target.value)} className={input}>
              <option value="">— selecione —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Fornecedor" hint="Puxa o nome automaticamente">
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
      <p className="text-[11px] text-ink-faint">
        Arquivo da nota (PDF/XML): anexe pelo botão 📎 na lista de Notas Fiscais, depois de salvar.
      </p>
    </ModalShell>
  );
}
