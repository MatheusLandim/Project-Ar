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
