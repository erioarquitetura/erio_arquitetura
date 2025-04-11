import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Despesa, FormaSaida } from '@/types/despesa';

/**
 * Lista todas as despesas
 */
export const listarDespesas = async (): Promise<Despesa[]> => {
  try {
    const { data, error } = await supabase
      .from('despesas' as any)
      .select(`
        *,
        banco:banco_id (nome, tipo_favorecido),
        categoria:categoria_id (nome, despesa_fixa, despesa_fiscal)
      `)
      .order('data_lancamento', { ascending: false });

    if (error) throw error;
    return data as unknown as Despesa[];
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    throw error;
  }
};

/**
 * Busca uma despesa pelo ID
 */
export const buscarDespesa = async (id: string): Promise<Despesa | null> => {
  try {
    const { data, error } = await supabase
      .from('despesas' as any)
      .select(`
        *,
        banco:banco_id (nome, tipo_favorecido),
        categoria:categoria_id (nome, despesa_fixa, despesa_fiscal)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Despesa;
  } catch (error) {
    console.error('Erro ao buscar despesa:', error);
    return null;
  }
};

/**
 * Cria uma nova despesa
 */
export const criarDespesa = async (despesa: {
  banco_id: string;
  categoria_id: string;
  data_lancamento: string;
  valor: number;
  forma_saida: FormaSaida;
  descricao: string;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: string;
  comprovante_url?: string;
}): Promise<Despesa> => {
  try {
    const { data, error } = await supabase
      .from('despesas' as any)
      .insert([despesa])
      .select(`
        *,
        banco:banco_id (nome, tipo_favorecido),
        categoria:categoria_id (nome, despesa_fixa, despesa_fiscal)
      `)
      .single();

    if (error) throw error;
    return data as unknown as Despesa;
  } catch (error: any) {
    console.error('Erro ao criar despesa:', error);
    toast.error(`Falha ao criar despesa: ${error.message || error}`);
    throw error;
  }
};

/**
 * Atualiza uma despesa existente
 */
export const atualizarDespesa = async (
  id: string,
  despesa: {
    banco_id?: string;
    categoria_id?: string;
    data_lancamento?: string;
    valor?: number;
    forma_saida?: FormaSaida;
    descricao?: string;
    status_pagamento?: 'pendente' | 'pago' | 'cancelado';
    data_pagamento?: string | null;
    comprovante_url?: string | null;
  }
): Promise<Despesa> => {
  try {
    const { data, error } = await supabase
      .from('despesas' as any)
      .update(despesa)
      .eq('id', id)
      .select(`
        *,
        banco:banco_id (nome, tipo_favorecido),
        categoria:categoria_id (nome, despesa_fixa, despesa_fiscal)
      `)
      .single();

    if (error) throw error;
    return data as unknown as Despesa;
  } catch (error: any) {
    console.error('Erro ao atualizar despesa:', error);
    toast.error(`Falha ao atualizar despesa: ${error.message || error}`);
    throw error;
  }
};

/**
 * Exclui uma despesa
 */
export const excluirDespesa = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('despesas' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erro ao excluir despesa:', error);
    toast.error(`Falha ao excluir despesa: ${error.message || error}`);
    throw error;
  }
};

/**
 * Lista todas as formas de saída disponíveis
 */
export const listarFormasSaida = async (): Promise<{ id: FormaSaida; nome: string }[]> => {
  // Esta é uma função estática que não precisa de consulta ao banco de dados
  return [
    { id: 'boleto', nome: 'Boleto' },
    { id: 'cartao_credito', nome: 'Cartão de Crédito' },
    { id: 'cartao_debito', nome: 'Cartão de Débito' },
    { id: 'pix', nome: 'PIX' },
    { id: 'transferencia', nome: 'Transferência Bancária' },
    { id: 'dinheiro', nome: 'Dinheiro' },
    { id: 'cheque', nome: 'Cheque' },
  ];
}; 

/**
 * Busca despesas dentro de um período específico
 */
export const getDespesasPeriodo = async (dataInicio: string, dataFim: string): Promise<any[]> => {
  try {
    console.log(`Buscando despesas no período: ${dataInicio} até ${dataFim}`);
    
    // Validar datas
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      console.error('Datas inválidas fornecidas para consulta de despesas');
      return [];
    }
    
    const { data, error } = await supabase
      .from('despesas' as any)
      .select(`
        *,
        banco:banco_id (nome, tipo_favorecido),
        categoria:categoria_id (nome, despesa_fixa, despesa_fiscal)
      `)
      .gte('data_lancamento', dataInicio)
      .lte('data_lancamento', dataFim);

    if (error) {
      console.error('Erro na consulta do Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Erro ao buscar despesas do período (${dataInicio} a ${dataFim}):`, error);
    return [];
  }
}; 