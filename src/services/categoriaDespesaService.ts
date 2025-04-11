import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CategoriaDespesa } from '@/types/categoriaDespesa';

/**
 * Lista todas as categorias de despesas
 */
export const listarCategoriasDespesas = async (): Promise<CategoriaDespesa[]> => {
  try {
    const { data, error } = await supabase
      .from('categorias_despesas' as any)
      .select('*')
      .order('nome');

    if (error) throw error;
    return data as unknown as CategoriaDespesa[];
  } catch (error) {
    console.error('Erro ao listar categorias de despesas:', error);
    throw error;
  }
};

/**
 * Busca uma categoria de despesa pelo ID
 */
export const buscarCategoriaDespesa = async (id: string): Promise<CategoriaDespesa | null> => {
  try {
    const { data, error } = await supabase
      .from('categorias_despesas' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CategoriaDespesa;
  } catch (error) {
    console.error('Erro ao buscar categoria de despesa:', error);
    return null;
  }
};

/**
 * Cria uma nova categoria de despesa
 */
export const criarCategoriaDespesa = async (categoria: { 
  nome: string; 
  descricao?: string;
  despesa_fixa: boolean;
  despesa_fiscal: boolean;
}): Promise<CategoriaDespesa> => {
  try {
    const { data, error } = await supabase
      .from('categorias_despesas' as any)
      .insert([categoria])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CategoriaDespesa;
  } catch (error: any) {
    console.error('Erro ao criar categoria de despesa:', error);
    toast.error(`Falha ao criar categoria: ${error.message || error}`);
    throw error;
  }
};

/**
 * Atualiza uma categoria de despesa existente
 */
export const atualizarCategoriaDespesa = async (
  id: string,
  categoria: { 
    nome: string; 
    descricao?: string;
    despesa_fixa?: boolean;
    despesa_fiscal?: boolean;
  }
): Promise<CategoriaDespesa> => {
  try {
    const { data, error } = await supabase
      .from('categorias_despesas' as any)
      .update(categoria)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CategoriaDespesa;
  } catch (error: any) {
    console.error('Erro ao atualizar categoria de despesa:', error);
    toast.error(`Falha ao atualizar categoria: ${error.message || error}`);
    throw error;
  }
};

/**
 * Exclui uma categoria de despesa
 */
export const excluirCategoriaDespesa = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('categorias_despesas' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erro ao excluir categoria de despesa:', error);
    toast.error(`Falha ao excluir categoria: ${error.message || error}`);
    throw error;
  }
}; 