export interface CategoriaDespesa {
  id: string;
  nome: string;
  descricao?: string;
  despesa_fixa: boolean;
  despesa_fiscal: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
} 