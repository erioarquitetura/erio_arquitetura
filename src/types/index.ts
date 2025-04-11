// Tipos básicos usados em todo o sistema

// Usuario
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar?: string;
  ativo: boolean;
  dataCriacao: string;
}

// Cliente
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco?: Endereco;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
  ativo: boolean;
}

// Fornecedor
export interface Fornecedor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco?: Endereco;
  categoria: string;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
  ativo: boolean;
}

// Serviço
export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  categoria: string;
  unidade: string;
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
}

// Transação Financeira (base para receitas e despesas)
export interface TransacaoFinanceira {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  contaBancaria: string;
  documentoFiscal?: string;
  formaPagamento: string;
  status: 'pendente' | 'pago' | 'cancelado';
  dataVencimento: string;
  dataPagamento?: string;
  parcelas?: number;
  clienteId?: string;
  fornecedorId?: string;
  observacoes?: string;
  anexos?: string[];
}

// Nota Fiscal
export interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  tipo: 'emitida' | 'recebida';
  data: string;
  valor: number;
  impostos: number;
  clienteId?: string;
  fornecedorId?: string;
  itens: ItemNotaFiscal[];
  status: 'pendente' | 'processando' | 'concluida' | 'cancelada';
  observacoes?: string;
  arquivoPdf?: string;
  arquivoXml?: string;
}

// Item de Nota Fiscal
export interface ItemNotaFiscal {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  servicoId?: string;
}

// Conta Bancária
export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
}

// Categoria
export interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa' | 'fornecedor' | 'servico';
  descricao?: string;
  cor?: string;
  ativo: boolean;
}

// Proposta de Orçamento
export interface Proposta {
  id: string;
  titulo: string;
  clienteId: string;
  data: string;
  dataValidade: string;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'vencida';
  valor: number;
  descricao: string;
  itens: ItemProposta[];
  observacoes?: string;
  arquivoPdf?: string;
}

// Item de Proposta
export interface ItemProposta {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  servicoId?: string;
}

// Endereço
export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Perfil da empresa
export interface PerfilEmpresa {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  logo?: string;
}

// Tipo para estatísticas de dashboard
export interface EstatisticasFinanceiras {
  saldoAtual: number;
  receitasMes: number;
  despesasMes: number;
  lucroMes: number;
  receitasPendentes: number;
  despesasPendentes: number;
  receitasPorCategoria: Record<string, number>;
  despesasPorCategoria: Record<string, number>;
  fluxoMensal: {
    mes: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }[];
  crescimentoReceitas?: number;
  crescimentoDespesas?: number;
  crescimentoLucro?: number;
  mesesDisponiveis?: {
    valor: string;
    texto: string;
  }[];
  mesAtual?: string;
  mesAnoSelecionado?: string;
}

export interface Notificacao {
  id: string;
  tipo: 'proposta_aprovada' | 'proposta_rejeitada';
  titulo: string;
  mensagem: string;
  proposta_id: string;
  lida: boolean;
  data_criacao: string;
  comentario?: string;
}
