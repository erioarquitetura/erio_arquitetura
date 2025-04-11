export type FormaSaida = 'boleto' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'dinheiro' | 'cheque';

export interface Despesa {
  id: string;
  banco_id: string;
  categoria_id: string;
  data_lancamento: string;
  valor: number;
  forma_saida: FormaSaida;
  descricao: string;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: string;
  comprovante_url?: string;
  data_criacao?: string;
  data_atualizacao?: string;

  // Campos relacionados (não são armazenados diretamente na tabela)
  banco?: {
    nome: string;
    tipo_favorecido: 'cpf' | 'cnpj';
  };
  categoria?: {
    nome: string;
    despesa_fixa: boolean;
    despesa_fiscal: boolean;
  };
} 