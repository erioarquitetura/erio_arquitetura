import { supabase } from "@/integrations/supabase/client";
import { CategoriaReceita } from "@/types/categoriaReceita";
import { toast } from "sonner";

/**
 * Lista todas as categorias de receitas
 */
export const listarCategoriasReceitas = async (): Promise<CategoriaReceita[]> => {
  try {
    // Usamos any para contornar a limitação atual do tipo do Supabase
    // que ainda não reconhece a tabela categorias_receitas
    const { data, error } = await supabase
      .from('categorias_receitas' as any)
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as CategoriaReceita[];
  } catch (error) {
    console.error('Erro ao listar categorias de receitas:', error);
    return [];
  }
};

/**
 * Busca uma categoria de receita pelo ID
 */
export const buscarCategoriaReceita = async (id: string): Promise<CategoriaReceita | null> => {
  try {
    const { data, error } = await supabase
      .from('categorias_receitas' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CategoriaReceita;
  } catch (error) {
    console.error('Erro ao buscar categoria de receita:', error);
    return null;
  }
};

/**
 * Cria uma nova categoria de receita
 */
export const criarCategoriaReceita = async (categoria: {
  nome: string;
  descricao?: string;
}): Promise<CategoriaReceita | null> => {
  try {
    const { data, error } = await supabase
      .from('categorias_receitas' as any)
      .insert([
        {
          nome: categoria.nome,
          descricao: categoria.descricao || null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CategoriaReceita;
  } catch (error) {
    console.error('Erro ao criar categoria de receita:', error);
    toast.error("Erro ao criar categoria");
    throw error;
  }
};

/**
 * Atualiza uma categoria de receita existente
 */
export const atualizarCategoriaReceita = async (
  id: string,
  categoria: {
    nome: string;
    descricao?: string;
  }
): Promise<CategoriaReceita | null> => {
  try {
    const { data, error } = await supabase
      .from('categorias_receitas' as any)
      .update({
        nome: categoria.nome,
        descricao: categoria.descricao || null,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CategoriaReceita;
  } catch (error) {
    console.error('Erro ao atualizar categoria de receita:', error);
    toast.error("Erro ao atualizar categoria");
    throw error;
  }
};

/**
 * Exclui uma categoria de receita
 */
export const excluirCategoriaReceita = async (id: string): Promise<boolean> => {
  try {
    // TODO: Quando a tabela de receitas estiver implementada, 
    // descomentar o código abaixo para verificar se a categoria está em uso
    /*
    // Verificar se a categoria está sendo usada em receitas
    const { count, error: countError } = await supabase
      .from('receitas')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', id);

    if (countError) throw countError;

    // Se a categoria estiver sendo usada, não permitir a exclusão
    if (count && count > 0) {
      toast.error("Esta categoria está em uso e não pode ser excluída");
      return false;
    }
    */

    // Excluir a categoria
    const { error } = await supabase
      .from('categorias_receitas' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir categoria de receita:', error);
    toast.error("Erro ao excluir categoria");
    throw error;
  }
}; 