export type Pagamento = {
  id: string;
  projeto_id: string;
  descricao: string | null;
  valor: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  criado_em: string;
};

export type Anexo = {
  id: string;
  projeto_id: string;
  tipo: string; // mantido por compatibilidade
  pasta: string | null;
  nome: string;
  path: string;
  tamanho: number | null;
  criado_em: string;
};

export type ItemOrcamento = { descricao: string; valor: number };

export type Orcamento = {
  id: string;
  numero: string | null;
  cliente_id: string | null;
  cliente_nome: string;
  titulo: string;
  status: string;
  intro: string | null;
  escopo: string | null;
  ambientes: string | null;
  normas: string | null;
  servicos: string | null;
  revisoes: string | null;
  nao_inclusos: string | null;
  itens: ItemOrcamento[];
  desconto: number | null;
  condicoes_pagamento: string | null;
  prazos: string | null;
  validade_dias: number | null;
  fecho: string | null;
  signatario_nome: string | null;
  signatario_cargo: string | null;
  obra_id: string | null;
  criado_em: string;
};

export function totalOrcamento(o: {
  itens: ItemOrcamento[];
  desconto: number | null;
}): number {
  const soma = (o.itens ?? []).reduce((s, i) => s + (Number(i.valor) || 0), 0);
  return soma - (Number(o.desconto) || 0);
}

export const STATUS_ORCAMENTO = [
  "Rascunho",
  "Enviado",
  "Aprovado",
  "Recusado",
] as const;

export type Cliente = {
  id: string;
  nome: string;
  tipo_pessoa: string | null;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  contato: string | null;
  endereco: string | null;
  observacoes: string | null;
  pasta_url: string | null;
  criado_em: string;
};

export type Projeto = {
  id: string;
  cliente: string;
  cliente_id: string | null;
  projeto: string;
  tipo: string | null;
  endereco: string | null;
  engenharia: string | null;
  rt_percentual: number | null;
  rt_pago: boolean | null;
  rt_data_pagamento: string | null;
  rt_obs: string | null;
  art_percentual: number | null;
  art_valor: number | null;
  art_pago: boolean | null;
  art_data_pagamento: string | null;
  art_obs: string | null;
  valor_total: number;
  status: string;
  data_inicio: string | null;
  data_previsao: string | null;
  observacoes: string | null;
  criado_em: string;
  pagamentos: Pagamento[];
  anexos: Anexo[];
};

export const STATUS_PROJETO = [
  "Proposta",
  "Aprovado",
  "Em execução",
  "Concluído",
  "Cancelado",
] as const;

export const TIPOS_PROJETO = [
  "Residencial",
  "Comercial",
  "Industrial",
  "Manutenção / PMOC",
  "Retrofit",
];

export const TIPOS_ANEXO: Record<string, string> = {
  nota_fiscal: "Nota Fiscal",
  boleto: "Boleto",
  outro: "Outro",
};

export const PASTAS_SUGERIDAS = [
  "Projeto executado",
  "Revisões",
  "Atualizações",
  "Notas Fiscais",
  "Boletos",
  "Contratos",
  "Outros",
];

export function pastaDeAnexo(a: Anexo): string {
  return a.pasta || TIPOS_ANEXO[a.tipo] || "Outros";
}

export function iconePasta(pasta: string | null): string {
  const s = (pasta ?? "").toLowerCase();
  if (s.includes("projeto")) return "📐";
  if (s.includes("revis")) return "🔁";
  if (s.includes("atualiz")) return "🆕";
  if (s.includes("nota")) return "🧾";
  if (s.includes("boleto")) return "📄";
  if (s.includes("contrato")) return "📑";
  return "📎";
}

export type PagamentoStatus = "pago" | "pendente" | "atrasado";

export function pagamentoStatus(p: Pagamento): PagamentoStatus {
  if (p.data_pagamento) return "pago";
  if (!p.data_vencimento) return "pendente";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(p.data_vencimento + "T00:00:00");
  return venc < hoje ? "atrasado" : "pendente";
}

export function rtValor(p: Projeto): number {
  return (Number(p.valor_total) * (Number(p.rt_percentual) || 0)) / 100;
}

export function artValor(p: Projeto): number {
  return Number(p.art_valor) || 0;
}

// ===================== Módulo Financeiro =====================

export type Fornecedor = {
  id: string;
  nome: string;
  cnpj_cpf: string | null;
  categoria: string | null;
  pasta_url: string | null;
  criado_em: string;
};

export type DespesaFixa = {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number | null;
  dia_vencimento: number;
  pasta_url: string | null;
  ativo: boolean;
  criado_em: string;
};

export type VinculoTipo = "obra" | "empresa" | "despesa_fixa" | "nenhum";
export type TipoContaPagar =
  | "boleto"
  | "nota_fiscal"
  | "despesa_extra"
  | "cartao_credito";

export type ContaPagar = {
  id: string;
  tipo: TipoContaPagar;
  descricao: string;
  fornecedor_id: string | null;
  categoria: string | null;
  valor: number;
  vencimento: string | null;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  anexo_url: string | null;
  obra_id: string | null;
  vinculo_tipo: VinculoTipo;
  vinculo_id: string | null;
  pasta_url: string | null;
  despesa_fixa_id: string | null;
  observacoes: string | null;
  criado_em: string;
};

export type TipoContaReceber = "boleto" | "pix" | "nota_fiscal";

export type ContaReceber = {
  id: string;
  cliente_id: string | null;
  obra_id: string | null;
  tipo: TipoContaReceber;
  valor: number;
  vencimento: string | null;
  data_recebimento: string | null;
  numero_nf: string | null;
  anexo_url: string | null;
  pasta_url: string | null;
  observacoes: string | null;
  criado_em: string;
};

export type ProLabore = {
  id: string;
  mes_referencia: string;
  valor: number;
  data_pagamento: string | null;
  comprovante_url: string | null;
  criado_em: string;
};

export type NotaFiscal = {
  id: string;
  direcao: "emitida" | "recebida";
  numero: string | null;
  tipo: "servico" | "produto";
  cliente_fornecedor: string | null;
  cliente_id: string | null;
  fornecedor_id: string | null;
  valor: number;
  data_emissao: string | null;
  impostos: number | null;
  status: "emitida" | "cancelada";
  arquivo_url: string | null;
  pasta_url: string | null;
  criado_em: string;
};

export type FinanceiroStatus = "pago" | "pendente" | "atrasado";

export function contaPagarStatus(c: ContaPagar): FinanceiroStatus {
  if (c.data_pagamento) return "pago";
  if (!c.vencimento) return "pendente";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(c.vencimento + "T00:00:00");
  return venc < hoje ? "atrasado" : "pendente";
}

export function contaReceberStatus(c: ContaReceber): FinanceiroStatus {
  if (c.data_recebimento) return "pago";
  if (!c.vencimento) return "pendente";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(c.vencimento + "T00:00:00");
  return venc < hoje ? "atrasado" : "pendente";
}

export const TIPOS_CONTA_PAGAR: Record<TipoContaPagar, string> = {
  boleto: "Boleto",
  nota_fiscal: "Nota Fiscal",
  despesa_extra: "Despesa Extra",
  cartao_credito: "Cartão de Crédito",
};

export const TIPOS_CONTA_RECEBER: Record<TipoContaReceber, string> = {
  boleto: "Boleto",
  pix: "Pix",
  nota_fiscal: "Nota Fiscal",
};

export const VINCULOS: Record<VinculoTipo, string> = {
  obra: "Obra",
  empresa: "Empresa",
  despesa_fixa: "Despesa Fixa",
  nenhum: "Nenhum",
};

export const CATEGORIAS_DESPESA = [
  "Contabilidade",
  "DAS",
  "DARF",
  "Convênio",
  "Cartão de Crédito",
  "Material",
  "Ferramenta",
  "Serviço",
  "Aluguel",
  "Outros",
];

export function mesReferenciaAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function labelMesReferencia(mes: string): string {
  const [ano, m] = mes.split("-");
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const idx = Number(m) - 1;
  return `${nomes[idx] ?? m}/${ano}`;
}
