import { Cliente } from "./index";
import { PropostaCompleta, PropostaCondicaoPagamento } from "./proposal";
import { CategoriaReceita } from "./categoriaReceita";

export type ReceitaStatus = 'pendente' | 'pago_parcial' | 'pago';

export interface FormaPagamento {
  id: string;
  nome: string;
  descricao?: string;
  requer_detalhes: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface DetalhesPagamentoPix {
  tipo_chave: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  chave: string;
  banco: string;
  banco_id?: string;
  nome_titular?: string;
}

export interface DetalhesPagamentoCartao {
  parcelas: number;
  taxa_juros: number;
  operadora?: string;
  maquina?: string;
  banco?: string;
  banco_id?: string;
}

export interface DetalhesPagamentoBoleto {
  banco?: string;
  banco_id?: string;
  codigo_barras?: string;
  linha_digitavel?: string;
}

export interface DetalhesPagamentoDinheiro {
  banco?: string;
  banco_id?: string;
  observacoes?: string;
}

export type DetalhesPagamento = DetalhesPagamentoPix | DetalhesPagamentoCartao | DetalhesPagamentoBoleto | DetalhesPagamentoDinheiro | Record<string, any>;

export interface ReceitaItem {
  id: string;
  receita_id: string;
  receita?: Receita;
  condicao_pagamento_id?: string;
  condicao_pagamento?: PropostaCondicaoPagamento;
  forma_pagamento_id: string;
  forma_pagamento?: FormaPagamento;
  valor: number;
  status: ReceitaStatus;
  data_vencimento: string; // formato ISO
  data_pagamento?: string; // formato ISO
  parcela: number;
  total_parcelas: number;
  taxa_juros?: number;
  detalhes_pagamento?: DetalhesPagamento;
  ordem?: number;
  descricao?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface Receita {
  id: string;
  proposta_id?: string;
  proposta?: PropostaCompleta;
  categoria_id?: string;
  categoria?: CategoriaReceita;
  cliente_id?: string;
  cliente?: Cliente;
  valor_total: number;
  descricao?: string;
  status: ReceitaStatus;
  data_vencimento?: string; // formato ISO
  data_pagamento?: string; // formato ISO
  observacoes?: string;
  itens?: ReceitaItem[];
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface ReceitaFormValues {
  proposta_id?: string;
  categoria_id?: string;
  descricao?: string;
  observacoes?: string;
  itens: {
    condicao_pagamento_id?: string;
    forma_pagamento_id: string;
    valor: number;
    data_vencimento: string;
    parcela?: number;
    total_parcelas?: number;
    taxa_juros?: number;
    detalhes_pagamento?: DetalhesPagamento;
    descricao?: string;
  }[];
} 