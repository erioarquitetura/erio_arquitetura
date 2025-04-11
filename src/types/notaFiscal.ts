import { ReceitaItem } from "./receita";

/**
 * Interface para o modelo de Nota Fiscal
 */
export interface NotaFiscal {
  id: string;
  receita_item_id: string;
  receita_item?: ReceitaItem;
  numero_nota: string;
  valor: number;
  taxa_imposto: number; // Novo campo para taxa de imposto em porcentagem (ex: 15.5)
  data_emissao: string; // formato ISO
  data_lancamento: string; // formato ISO
  proposta_codigo?: string;
  cliente_nome?: string;
  observacoes?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

/**
 * Interface para o formulário de criação/edição de Nota Fiscal
 */
export interface NotaFiscalFormValues {
  receita_item_id: string;
  numero_nota: string;
  valor: number;
  taxa_imposto: number; // Novo campo para taxa de imposto em porcentagem (ex: 15.5)
  data_emissao: string; // formato ISO
  data_lancamento: string; // Adicionando o campo que estava faltando
  observacoes?: string;
}

/**
 * Interface que estende ReceitaItem para incluir informações adicionais
 * para exibição no combobox de seleção de itens
 */
export interface ReceitaItemParaNotaFiscal extends ReceitaItem {
  proposta_codigo?: string;
  cliente_nome?: string;
  item_ordem_total?: string; // Ex: "1/3", "2/3", etc.
} 