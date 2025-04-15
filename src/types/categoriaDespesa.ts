export interface CategoriaDespesa {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  despesa_fiscal: boolean;
  despesa_fixa?: boolean;
  created_at?: string;
  updated_at?: string;
  data_criacao?: string;
  data_atualizacao?: string;
} 