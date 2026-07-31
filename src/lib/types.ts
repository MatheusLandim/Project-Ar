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

export type PessoaCliente = {
  id: string;
  cliente_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
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
  tem_rt: boolean;
  rt_percentual: number | null;
  rt_pago: boolean | null;
  rt_data_pagamento: string | null;
  rt_obs: string | null;
  tem_art: boolean;
  art_percentual: number | null;
  art_valor: number | null;
  art_pago: boolean | null;
  art_data_pagamento: string | null;
  art_obs: string | null;
  com_imposto: boolean;
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
  "Em execução (projeto preliminar)",
  "Em revisão",
  "Concluído (projeto executivo)",
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

export type TipoPasta = "fixa" | "variavel" | "receita_recorrente";

export type Fornecedor = {
  id: string;
  nome: string;
  cnpj_cpf: string | null;
  categoria: string | null;
  tipo_pasta: TipoPasta;
  pasta_url: string | null;
  criado_em: string;
};

export type DespesaFixa = {
  id: string;
  descricao: string;
  categoria: string | null;
  fornecedor_id: string | null;
  valor: number | null;
  dia_vencimento: number;
  pasta_url: string | null;
  ativo: boolean;
  criado_em: string;
};

// Subpastas fixas dentro de cada mês, pra separar por tipo de documento.
export const PASTAS_MES = ["Boletos", "Comprovantes", "Recibos", "Notas Fiscais"];

// Caminho completo: Ano/Mês/TipoDocumento (ex.: "2026/Junho/Boletos")
export function pastaCompetenciaTipo(mes: string, tipoDoc: string): string {
  return `${pastaCompetencia(mes)}/${tipoDoc}`;
}

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
  mes_competencia: string | null; // "YYYY-MM" — mês a que a despesa se refere (pode ser diferente do vencimento/pagamento)
  observacoes: string | null;
  criado_em: string;
};

export const FORMAS_PAGAMENTO = ["Boleto", "Pix", "Transferência", "Cartão de crédito"];

export type TipoContaReceber = "boleto" | "pix" | "nota_fiscal";

export type ContaReceber = {
  id: string;
  cliente_id: string | null;
  obra_id: string | null;
  fornecedor_id: string | null; // pasta do contratante, quando é um recebimento recorrente
  receita_recorrente_id: string | null;
  mes_competencia: string | null; // "YYYY-MM"
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

export type ReceitaRecorrente = {
  id: string;
  descricao: string;
  categoria: string | null;
  fornecedor_id: string | null;
  valor: number | null;
  dia_vencimento: number;
  ativo: boolean;
  criado_em: string;
};

export type ProLabore = {
  id: string;
  mes_referencia: string;
  valor: number;
  data_pagamento: string | null;
  forma_transferencia: string | null;
  comprovante_url: string | null;
  criado_em: string;
};

export const FORMAS_TRANSFERENCIA = ["Pix", "Transferência bancária"];

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

// Caminho de pasta Ano/Mês pra organizar despesas fixas (ex: "2026/Junho"),
// usado dentro da pasta de cada despesa fixa (DAS, convênio, etc.)
export function pastaCompetencia(mes: string): string {
  const [ano, m] = mes.split("-");
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const idx = Number(m) - 1;
  return `${ano}/${nomes[idx] ?? m}`;
}

// Linha unificada de recebíveis: junta Contas a Receber (nativo do
// Financeiro) com os "Recebimentos" antigos ligados a obras (tabela
// pagamentos), pra aparecerem numa lista só com o mesmo dar-baixa/reabrir
// e no mesmo relatório mensal.
export type OrigemReceber = "receber" | "obra";

export type LinhaReceber = {
  id: string;
  origem: OrigemReceber;
  titulo: string;
  subtitulo: string;
  valor: number;
  vencimento: string | null;
  dataRecebimento: string | null;
  status: FinanceiroStatus;
  clienteId: string | null;
  obraId: string | null;
  fornecedorId: string | null;
  mesCompetencia: string | null;
};

export type EntidadeTipo = "cliente" | "fornecedor" | "projeto" | "empresa" | "despesa_fixa";

// Pasta geral de documentos da empresa (aba Documentos) — usa esse id fixo
// como entidade_id porque não está ligada a um cliente/obra específico.
export const DOCUMENTOS_GERAL_ID = "00000000-0000-0000-0000-000000000001";
export type LancamentoTipo = "pagar" | "receber" | "nota";

export type Documento = {
  id: string;
  entidade_tipo: EntidadeTipo | null;
  entidade_id: string | null;
  lancamento_tipo: LancamentoTipo | null;
  lancamento_id: string | null;
  pasta: string | null; // caminho completo, ex: "Notas Fiscais/Nota sinal"
  nome: string;
  path: string;
  tamanho: number | null;
  criado_em: string;
};

export type PastaDocumento = {
  id: string;
  entidade_tipo: EntidadeTipo;
  entidade_id: string;
  caminho: string; // caminho completo, ex: "Notas Fiscais/Nota sinal"
  criado_em: string;
};

// Nome exibido de uma pasta = último segmento do caminho
export function nomeDoCaminho(caminho: string): string {
  const partes = caminho.split("/").filter(Boolean);
  return partes[partes.length - 1] ?? caminho;
}

// Caminho do pai (uma pasta acima). Raiz = ""
export function caminhoPai(caminho: string): string {
  const partes = caminho.split("/").filter(Boolean);
  partes.pop();
  return partes.join("/");
}

export function juntarCaminho(base: string, nome: string): string {
  return base ? `${base}/${nome}` : nome;
}

export const PASTAS_ENTIDADE = ["Notas Fiscais", "Boletos", "Comprovantes", "Outros"];

// ============================================================
//  Configurações: perfis de usuário (permissões) e dados da empresa
// ============================================================

export type Perfil = {
  id: string;
  user_id: string | null;
  email: string;
  nome: string | null;
  is_admin: boolean;
  areas: string[];
  ativo: boolean;
  criado_em: string;
};

export type Configuracoes = {
  id: number;
  razao_social: string;
  cnpj: string;
  paleta_cor: string;
  relatorio_base_padrao: string;
  atualizado_em: string;
};

// Cada área corresponde a uma aba do menu lateral (View em Sidebar.tsx)
export const AREAS_DISPONIVEIS: { id: string; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "clientes", label: "Obras / Clientes" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "rt", label: "RT / ART" },
  { id: "documentos", label: "Documentos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "fornecedores", label: "Fornecedores" },
];

// Paletas de cor prontas — cada uma já testada em claro/escuro pra não
// quebrar contraste em nenhuma tela.
export const PALETAS: {
  id: string;
  nome: string;
  claro: { brand: string; brandDark: string; brandSoft: string };
  escuro: { brand: string; brandDark: string; brandSoft: string };
}[] = [
  {
    id: "azul",
    nome: "Azul (padrão)",
    claro: { brand: "62 124 177", brandDark: "44 92 138", brandSoft: "224 238 248" },
    escuro: { brand: "96 162 219", brandDark: "62 124 177", brandSoft: "28 47 70" },
  },
  {
    id: "verde",
    nome: "Verde",
    claro: { brand: "15 118 110", brandDark: "13 94 89", brandSoft: "219 240 237" },
    escuro: { brand: "45 178 168", brandDark: "15 118 110", brandSoft: "22 54 51" },
  },
  {
    id: "roxo",
    nome: "Roxo",
    claro: { brand: "109 90 190", brandDark: "84 68 153", brandSoft: "231 227 248" },
    escuro: { brand: "150 133 224", brandDark: "109 90 190", brandSoft: "42 36 66" },
  },
  {
    id: "grafite",
    nome: "Grafite",
    claro: { brand: "71 85 105", brandDark: "51 65 85", brandSoft: "226 232 240" },
    escuro: { brand: "148 163 184", brandDark: "100 116 139", brandSoft: "38 43 51" },
  },
];
