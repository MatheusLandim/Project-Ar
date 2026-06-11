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
  tipo: string; // nota_fiscal | boleto | outro
  nome: string;
  path: string;
  tamanho: number | null;
  criado_em: string;
};

export type Projeto = {
  id: string;
  cliente: string;
  projeto: string;
  tipo: string | null;
  endereco: string | null;
  engenharia: string | null;
  rt_percentual: number | null;
  rt_pago: boolean | null;
  rt_data_pagamento: string | null;
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
